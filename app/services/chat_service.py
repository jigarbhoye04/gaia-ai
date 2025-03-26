import asyncio
from datetime import datetime, timezone

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
from app.prompts.user.chat_prompts import CONVERSATION_DESCRIPTION_GENERATOR
from app.services.file_service import fetch_files
from app.services.image_service import generate_image_stream
from app.services.internet_service import do_deep_search, do_search, fetch_webpages
from app.utils.llm_utils import (
    do_prompt_no_stream,
    do_prompt_with_stream,
)
from app.services.notes_service import fetch_notes
from app.utils.chat_utils import classify_intent
from app.utils.notes_utils import store_note
from app.utils.pipeline_utils import Pipeline


async def chat_stream(
    body: MessageRequestWithHistory,
    background_tasks: BackgroundTasks,
    user: dict,
    llm_model: str,
) -> StreamingResponse:
    """
    Stream chat messages in real-time using the plug-and-play pipeline.

    This function coordinates the processing of chat messages through a pipeline,
    including optional web search, deep internet search, document fetching,
    and other enhancements before sending to the language model.

    Args:
        body (MessageRequestWithHistory): Contains the message, conversation ID, message history,
                                         and optional flags for search features
        background_tasks (BackgroundTasks): FastAPI background tasks object for async operations
        user (dict): User information from authentication
        llm_model (str): Default LLM model identifier to use for generation

    Returns:
        StreamingResponse: A streaming response containing the LLM's generated content
    """
    last_message = body.messages[-1] if body.messages else None

    context = {
        "user_id": user.get("user_id"),
        "conversation_id": body.conversation_id,
        "query_text": last_message.get("content", ""),
        "last_message": last_message,
        "body": body,
        "llm_model": llm_model,
        "user": user,
        "intent": None,
        "messages": jsonable_encoder(body.messages),
        "search_web": body.search_web,
        "deep_search": body.deep_search,
        "pageFetchURLs": body.pageFetchURLs,
        "fileIds": body.fileIds,  # File IDs associated with the message
        "fileData": body.fileData
        if hasattr(body, "fileData")
        else [],  # Complete file metadata
    }

    context = await classify_intent(context)

    if context["intent"] == "generate_image":
        return StreamingResponse(
            generate_image_stream(context["query_text"]),
            media_type="text/event-stream",
        )

    # choose_llm_model,
    pipeline_steps = [
        fetch_webpages,
        do_deep_search,
        do_search,
        fetch_notes,
        fetch_files,
    ]

    pipeline = Pipeline(pipeline_steps)
    context = await pipeline.run(context)

    background_tasks.add_task(store_note, context["query_text"], context["user_id"])

    context["messages"][-1] = context["last_message"]

    return StreamingResponse(
        do_prompt_with_stream(
            messages=context["messages"],
            max_tokens=4096,
            intent=context["intent"],
            model=context["llm_model"],
            context=context,
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
    Add messages to an existing conversation, including any file IDs attached to the messages.
    """
    user_id = user.get("user_id")
    conversation_id = request.conversation_id

    messages = []
    for message in request.messages:
        message_dict = message.model_dump(exclude={"loading"})
        # Remove None values to keep the document clean
        message_dict = {
            key: value for key, value in message_dict.items() if value is not None
        }
        # Ensure message has an ID
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
    conversation_id: str, data: DescriptionUpdateRequestLLM, user: dict, model: str
) -> dict:
    """
    Update the conversation description using an LLM-generated summary.
    """
    user_id = user.get("user_id")
    description = "New Chat"

    try:
        response = await do_prompt_no_stream(
            prompt=CONVERSATION_DESCRIPTION_GENERATOR.format(
                user_message=data.userFirstMessage
            ),
            max_tokens=5,
            model=model,
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
