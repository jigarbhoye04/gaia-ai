import asyncio
from datetime import datetime, timezone
from typing import Any, Dict

from bson import ObjectId
from fastapi import BackgroundTasks, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse

from app.config.loggers import chat_logger as logger
from app.db.collections import conversations_collection
from app.models.chat_models import ConversationModel, UpdateMessagesRequest
from app.models.general_models import (
    DescriptionUpdateRequest,
    DescriptionUpdateRequestLLM,
    MessageRequest,
    MessageRequestWithHistory,
)
from app.models.notes_models import NoteModel
from app.services.llm_service import (
    do_prompt_no_stream,
    do_prompt_with_stream,
)
from app.services.pipeline_service import Pipeline
from app.services.text_service import classify_event_type
from app.utils.embedding_utils import query_documents, search_notes_by_similarity
from app.utils.notes import insert_note
from app.utils.notes_utils import should_create_memory
from app.utils.search_utils import perform_fetch, perform_search


async def do_search(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform a web search and append relevant context to the last message.
    """
    last_message = context["last_message"]
    query_text = context["query_text"]
    search_result = await perform_search(query=query_text, count=5)
    last_message["content"] += (
        f"\nRelevant context using GAIA web search: {search_result}. Use citations and references for all the content. "
        "Add citations after each line where something is cited like [1] but the link should be in markdown (like this: [[1]](https://example.com))."
    )
    return context


async def fetch_webpage(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch a webpage and append its content to the last message.
    """
    body = context["body"]
    if body.pageFetchURL and context["last_message"]:
        page_content = await perform_fetch(body.pageFetchURL)
        context["last_message"]["content"] += (
            f"\nRelevant context from the fetched URL: {page_content}"
        )
    return context


async def store_note(query_text: str, user_id: str) -> None:
    """
    Store a note if the query meets memory creation criteria.
    """
    is_memory, plaintext, content = await should_create_memory(query_text)
    if is_memory and content and plaintext:
        await insert_note(
            note=NoteModel(plaintext=plaintext, content=content),
            user_id=user_id,
            auto_created=True,
        )


async def fetch_notes(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch similar notes and append their content to the last message.
    """
    last_message = context["last_message"]
    query_text = context["query_text"]
    user = context["user"]
    notes = await search_notes_by_similarity(
        input_text=query_text, user_id=user.get("user_id")
    )
    if notes:
        last_message["content"] = (
            f"User: {last_message['content']} \n System: The user has the following notes: "
            f"{'- '.join(notes)} (Fetched from the Database). Only mention these notes when relevant to the conversation."
        )
        context["notes_added"] = True
    else:
        context["notes_added"] = False
    return context


async def fetch_documents(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch documents related to the query and append their content to the last message.
    """
    last_message = context["last_message"]
    query_text = context["query_text"]
    conversation_id = context["conversation_id"]
    user_id = context["user_id"]

    documents = await query_documents(query_text, conversation_id, user_id)

    if documents and len(documents) > 0:
        content = [doc["content"] for doc in documents]
        titles = [doc["title"] for doc in documents]
        prompt = (
            f"Question: {last_message['content']}\n\n"
            f"Context from document files uploaded by the user:\n"
            f"{{'document_names': {titles}, 'content': {content}}}"
        )
        last_message["content"] = prompt
        context["docs_added"] = True
    else:
        context["docs_added"] = False
    return context


async def classify_event(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Classify the event type and set the intent if applicable.
    """
    type_result = await classify_event_type(context["query_text"])
    if type_result.get("highest_label") and type_result.get("highest_score", 0) >= 0.5:
        if type_result["highest_label"] in ["add to calendar", "set a reminder"]:
            context["intent"] = "calendar"
    return context


async def choose_llm_model(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Choose an LLM model based on whether notes or documents were added.
    """
    if context.get("notes_added") or context.get("docs_added"):
        context["llm_model"] = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    return context


async def chat_stream(
    body: MessageRequestWithHistory,
    background_tasks: BackgroundTasks,
    user: dict,
) -> StreamingResponse:
    """
    Stream chat messages in real-time using the plug-and-play pipeline.
    """
    last_message = body.messages[-1] if body.messages else None

    context = {
        "user_id": user.get("user_id"),
        "conversation_id": body.conversation_id,
        "query_text": last_message["content"],
        "last_message": last_message,
        "body": body,
        "user": user,
        "llm_model": "@cf/meta/llama-3.1-8b-instruct-fast",
        "intent": None,
        "messages": jsonable_encoder(body.messages),
    }

    pipeline_steps = [
        fetch_notes,
        fetch_documents,
        classify_event,
        choose_llm_model,
        fetch_webpage,
        do_search,
    ]

    pipeline = Pipeline(pipeline_steps)
    context = await pipeline.run(context)

    background_tasks.add_task(store_note, context["query_text"], context["user_id"])

    return StreamingResponse(
        do_prompt_with_stream(
            messages=context["messages"],
            max_tokens=4096,
            intent=context["intent"],
            model=context["llm_model"],
        ),
        media_type="text/event-stream",
    )


async def chat(request: MessageRequest) -> dict:
    """
    Get a chat response without streaming.
    """
    response = await do_prompt_no_stream(request.message)
    return response


async def create_conversation(conversation: ConversationModel, user: dict) -> dict:
    """
    Create a new conversation.
    """
    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
        )

    created_at = datetime.now(timezone.utc).isoformat()
    conversation_data = {
        "user_id": user_id,
        "conversation_id": conversation.conversation_id,
        "description": conversation.description,
        "messages": [],
        "createdAt": created_at,
    }

    try:
        insert_result = await conversations_collection.insert_one(conversation_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}",
        )

    if not insert_result.acknowledged:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation",
        )

    return {
        "conversation_id": conversation.conversation_id,
        "user_id": user_id,
        "createdAt": created_at,
        "detail": "Conversation created successfully",
    }


async def get_conversations(user: dict, page: int = 1, limit: int = 10) -> dict:
    """
    Fetch paginated conversations for the authenticated user, including starred conversations.
    """
    user_id = user["user_id"]

    projection = {
        "_id": 1,
        "user_id": 1,
        "conversation_id": 1,
        "description": 1,
        "starred": 1,
        "createdAt": 1,
    }

    starred_filter = {"user_id": user_id, "starred": True}
    non_starred_filter = {
        "user_id": user_id,
        "$or": [{"starred": {"$exists": False}}, {"starred": False}],
    }
    skip = (page - 1) * limit

    starred_future = (
        conversations_collection.find(starred_filter, projection)
        .sort("createdAt", -1)
        .to_list(None)
    )
    non_starred_count_future = conversations_collection.count_documents(
        non_starred_filter
    )
    non_starred_future = (
        conversations_collection.find(non_starred_filter, projection)
        .sort("createdAt", -1)
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )

    (
        starred_conversations,
        non_starred_count,
        non_starred_conversations,
    ) = await asyncio.gather(
        starred_future, non_starred_count_future, non_starred_future
    )

    def convert_ids(conversations):
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
        return conversations

    starred_conversations = convert_ids(starred_conversations)
    non_starred_conversations = convert_ids(non_starred_conversations)

    combined_conversations = starred_conversations + non_starred_conversations
    total = len(starred_conversations) + non_starred_count
    total_pages = (
        ((non_starred_count + limit - 1) // limit) if non_starred_count > 0 else 1
    )

    result = {
        "conversations": combined_conversations,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }

    return result


async def get_conversation(conversation_id: str, user: dict) -> dict:
    """
    Fetch a specific conversation by ID.
    """
    user_id = user.get("user_id")
    conversation = await conversations_collection.find_one(
        {"user_id": user_id, "conversation_id": conversation_id}
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user",
        )

    conversation["_id"] = str(conversation["_id"])
    return conversation


async def update_messages(request: UpdateMessagesRequest, user: dict) -> dict:
    """
    Add messages to an existing conversation.
    """
    user_id = user.get("user_id")
    conversation_id = request.conversation_id

    messages = []
    for message in request.messages:
        message_dict = message.model_dump(exclude={"loading"})
        message_dict = {
            key: value for key, value in message_dict.items() if value is not None
        }
        message_dict.setdefault("message_id", str(ObjectId()))
        messages.append(message_dict)

    update_result = await conversations_collection.update_one(
        {"user_id": user_id, "conversation_id": conversation_id},
        {"$push": {"messages": {"$each": messages}}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user",
        )

    return {"conversation_id": conversation_id, "message": "Messages updated"}


async def update_conversation_description_llm(
    conversation_id: str, data: DescriptionUpdateRequestLLM, user: dict
) -> dict:
    """
    Update the conversation description using an LLM-generated summary.
    """
    user_id = user.get("user_id")
    description = "New Chat"

    try:
        response = await do_prompt_no_stream(
            prompt=(
                f"'{data.userFirstMessage}'\nRephrase this text into a succinct topic description (maximum 4 words). "
                "Do not answer the message—simply summarize its subject. Do not add any sort of formatting or markdown, just respond in plaintext."
            ),
            max_tokens=5,
        )
        description = (response.get("response", "New Chat")).replace('"', "")
    except Exception as e:
        logger.error(f"LLM call failed: {e}")

    try:
        update_result = await conversations_collection.update_one(
            {"user_id": user_id, "conversation_id": conversation_id},
            {"$set": {"description": description}},
        )

        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=404, detail="Conversation not found or update failed"
            )
    except Exception as e:
        logger.error(f"Update conversation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Update failed {e}")

    return {
        "message": "Conversation updated successfully",
        "description": description,
    }


async def update_conversation_description(
    conversation_id: str, data: DescriptionUpdateRequest, user: dict
) -> dict:
    """
    Update the conversation description.
    """
    user_id = user.get("user_id")

    update_result = await conversations_collection.update_one(
        {"user_id": user_id, "conversation_id": conversation_id},
        {"$set": {"description": data.description}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Conversation not found or update failed"
        )

    return {
        "message": "Conversation updated successfully",
        "description": data.description,
    }


async def star_conversation(conversation_id: str, starred: bool, user: dict) -> dict:
    """
    Star or unstar a conversation.
    """
    user_id = user.get("user_id")
    update_result = await conversations_collection.update_one(
        {"user_id": user_id, "conversation_id": conversation_id},
        {"$set": {"starred": starred}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Conversation not found or update failed"
        )

    return {"message": "Conversation updated successfully", "starred": starred}


async def delete_all_conversations(user: dict) -> dict:
    """
    Delete all conversations for the authenticated user.
    """
    user_id = user.get("user_id")
    delete_result = await conversations_collection.delete_many({"user_id": user_id})

    if delete_result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="No conversations found for the user",
        )

    return {"message": "All conversations deleted successfully"}


async def delete_conversation(conversation_id: str, user: dict) -> dict:
    """
    Delete a specific conversation by ID.
    """
    user_id = user.get("user_id")
    delete_result = await conversations_collection.delete_one(
        {"user_id": user_id, "conversation_id": conversation_id}
    )

    if delete_result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user",
        )

    return {
        "message": "Conversation deleted successfully",
        "conversation_id": conversation_id,
    }


async def pin_message(
    conversation_id: str, message_id: str, pinned: bool, user: dict
) -> dict:
    """
    Pin or unpin a message within a conversation.
    """
    user_id = user.get("user_id")
    conversation = await conversations_collection.find_one(
        {"user_id": user_id, "conversation_id": conversation_id}
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = conversation.get("messages", [])
    target_message = next(
        (msg for msg in messages if msg.get("message_id") == message_id), None
    )

    if not target_message:
        raise HTTPException(status_code=404, detail="Message not found in conversation")

    update_result = await conversations_collection.update_one(
        {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "messages.message_id": message_id,
        },
        {"$set": {"messages.$.pinned": pinned}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Message not found or update failed"
        )

    response_message = (
        f"Message with ID {message_id} pinned successfully"
        if pinned
        else f"Message with ID {message_id} unpinned successfully"
    )

    return {"message": response_message, "pinned": pinned}


async def get_starred_messages(user: dict) -> dict:
    """
    Fetch all pinned messages across all conversations for the authenticated user.
    """
    user_id = user.get("user_id")

    results = await conversations_collection.aggregate(
        [
            {"$match": {"user_id": user_id}},
            {"$unwind": "$messages"},
            {"$match": {"messages.pinned": True}},
            {"$project": {"_id": 0, "conversation_id": 1, "message": "$messages"}},
        ]
    ).to_list(None)

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No pinned messages found across any conversation",
        )

    return {"results": results}
