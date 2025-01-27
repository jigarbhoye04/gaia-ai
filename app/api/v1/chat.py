from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, StreamingResponse
from app.db.connect import conversations_collection
from app.db.redis import set_cache, get_cache, delete_cache
from datetime import timezone
from app.services.search import perform_search, perform_fetch
from app.middleware.auth import get_current_user
from datetime import datetime
import asyncio
from app.utils.embeddings import search_notes_by_similarity, query_documents
from app.models.conversations import ConversationModel, UpdateMessagesRequest
from pydantic import BaseModel
from bson import ObjectId
from app.schemas.common import (
    DescriptionUpdateRequest,
    DescriptionUpdateRequestLLM,
    MessageRequest,
    MessageRequestWithHistory,
)
from app.services.llm import (
    doPrompWithStream,
    doPromptNoStream,
)

# from app.services.text import classify_event_type

router = APIRouter()


@router.post("/chat-stream")
async def chat_stream(
    body: MessageRequestWithHistory,
    user: dict = Depends(get_current_user),
):
    """
    Stream chat messages in real-time.

    Args:
        request (MessageRequestWithHistory): Request containing a message and conversation history.

    Returns:
        StreamingResponse: Streamed response for real-time communication.

    """
    intent = None
    last_message = body.messages[-1] if body.messages else None
    query_text = (last_message["content"]).replace("mostRecent: true ", "")

    # Helper Functions
    async def do_search(last_message, query_text):
        search_result = await perform_search(query=query_text)
        last_message["content"] += (
            f"\nRelevant context using GAIA web search: {search_result}"
        )

    async def fetch_webpage(last_message, url):
        page_content = await perform_fetch(url)
        last_message["content"] += (
            f"\nRelevant context from the fetched URL: {page_content}"
        )

    async def fetch_notes(last_message, query_text):
        notes = await search_notes_by_similarity(
            input_text=query_text, user_id=user.get("user_id")
        )
        last_message["content"] = f"""
            User: {last_message["content"]} \n System: The user has the following notes: {"- ".join(notes)} (Fetched from the Database). Only mention these notes when relevant to the conversation
            """

    async def fetch_documents(last_message, query_text):
        documents = await query_documents(
            query_text, body.conversation_id, user.get("user_id")
        )
        if not documents or len(documents) <= 0:
            return
        content = [document["content"] for document in documents]
        titles = [document["title"] for document in documents]

        prompt = f"Question: {last_message['content']}\n\n Context from document files uploaded by the user:\n{ {'document_names': titles, 'content': content} }"
        last_message["content"] = prompt

    # Call Functions
    await fetch_notes(last_message, query_text)
    await fetch_documents(last_message, query_text)

    if body.pageFetchURL and last_message:
        await fetch_webpage(last_message, body.pageFetchURL)

    if body.search_web and last_message:
        await do_search(last_message, query_text)

    # search_start_time = time.time()
    # type = await classify_event_type(query_text)
    # search_end_time = time.time()
    # print(
    #     f"classify_event_type took {search_end_time - search_start_time:.4f} seconds",
    #     type,
    # )
    # if type.get("highest_label"):
    #     match type["highest_label"]:
    #         case "search web internet":
    #             await do_search(last_message, query_text)
    #         case "flowchart":
    #             intent = "flowchart"
    #         case "weather":
    #             intent = "weather"

    return StreamingResponse(
        doPrompWithStream(
            messages=jsonable_encoder(body.messages),
            max_tokens=4096,
            intent=intent,
            model="@cf/meta/llama-3.1-8b-instruct-fast",
            # model="@cf/meta/llama-3.1-70b-instruct"
            # model="@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        ),
        media_type="text/event-stream",
    )

    # return StreamingResponse(
    #     # doPromptWithStreamAsync(
    #     doPromptGROQ(
    #         messages=jsonable_encoder(request.messages), max_tokens=2048, stream=True
    #     ),
    #     media_type="text/event-stream",
    # )


@router.post("/chat")
async def chat(request: MessageRequest):
    """
    Get a chat response.

    Args:
        request (MessageRequest): Request containing the user message.

    Returns:
        JSONResponse: Response with the chat output.
    """
    return JSONResponse(content=await doPromptNoStream(request.message))


@router.post("/conversations")
async def create_conversation(
    conversation: ConversationModel, user: dict = Depends(get_current_user)
):
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

    # await delete_cache(f"conversations_cache:{user_id}")
    asyncio.create_task(delete_cache(f"conversations_cache:{user_id}"))

    return {
        "conversation_id": conversation.conversation_id,
        "user_id": user_id,
        "createdAt": created_at,
        "detail": "Conversation created successfully",
    }


@router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    """
    Fetch all conversations for the authenticated user.
    """
    user_id = user["user_id"]
    cache_key = f"conversations_cache:{user_id}"

    # Check cache for conversations
    cached_conversations = await get_cache(cache_key)
    if cached_conversations:
        return {"conversations": jsonable_encoder(cached_conversations)}

    # Fetch all conversations for the user
    conversations = await conversations_collection.find(
        {"user_id": user_id},
        {
            "_id": 1,
            "user_id": 1,
            "conversation_id": 1,
            "description": 1,
            "starred": 1,
            "createdAt": 1,
        },
    ).to_list(None)

    if not conversations:
        await set_cache(cache_key, [])
        return {"conversations": []}

    # Convert ObjectId to string
    for conversation in conversations:
        conversation["_id"] = str(conversation["_id"])

    # Cache the result
    await set_cache(cache_key, jsonable_encoder(conversations))

    return {"conversations": conversations}


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str, user: dict = Depends(get_current_user)
):
    """
    Fetch a specific conversation by ID.
    """
    user_id = user.get("user_id")

    # Find the conversation document
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


@router.put("/conversations/{conversation_id}/messages")
async def update_messages(
    request: UpdateMessagesRequest, user: dict = Depends(get_current_user)
):
    """
    Add messages to an existing conversation.
    """
    user_id = user.get("user_id")
    conversation_id = request.conversation_id
    # messages = [message.dict(exclude={"loading"}) for message in request.messages]

    messages = []
    for message in request.messages:
        message_dict = message.dict(exclude={"loading"})  # Convert to dictionary
        message_dict = {
            key: value for key, value in message_dict.items() if value is not None
        }
        print(f"{message_dict=}")
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


@router.put("/conversations/{conversation_id}/description/llm")
async def update_conversation_description_llm(
    conversation_id: str,
    data: DescriptionUpdateRequestLLM,
    user: dict = Depends(get_current_user),
):
    """
    Update the description of a conversation, but fetch description using the LLM.
    """
    user_id = user.get("user_id")

    # Generate a summary for the description
    response = await doPromptNoStream(
        prompt=f"User has asked this to the AI assistant: '{data.userFirstMessage}'. Tell me about the user's question in 3-4 words. Do not answer the users' question, just summarise what it is about.",
        max_tokens=7,
    )
    description = (response.get("response", "New Chat")).replace('"', "")

    # Update the description in the database
    update_result = await conversations_collection.update_one(
        {"user_id": user_id, "conversation_id": conversation_id},
        {"$set": {"description": description}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Conversation not found or update failed"
        )

    # Invalidate Redis cache
    await delete_cache(f"conversations_cache:{user_id}")

    return JSONResponse(
        content={
            "message": "Conversation updated successfully",
            "description": description,
        }
    )


@router.put("/conversations/{conversation_id}/description")
async def update_conversation_description(
    conversation_id: str,
    data: DescriptionUpdateRequest,
    user: dict = Depends(get_current_user),
):
    """
    Update the description of a conversation.
    """
    user_id = user.get("user_id")

    # Update the description in the database
    update_result = await conversations_collection.update_one(
        {"user_id": user_id, "conversation_id": conversation_id},
        {"$set": {"description": data.description}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Conversation not found or update failed"
        )

    # Invalidate Redis cache
    await delete_cache(f"conversations_cache:{user_id}")

    return JSONResponse(
        content={
            "message": "Conversation updated successfully",
            "description": data.description,
        }
    )


class StarredUpdate(BaseModel):
    starred: bool


class PinnedUpdate(BaseModel):
    pinned: bool


@router.put("/conversations/{conversation_id}/star")
async def star_conversation(
    conversation_id: str,
    body: StarredUpdate,
    user: dict = Depends(get_current_user),
):
    """
    Update the description of a conversation.
    """
    user_id = user.get("user_id")

    # Update the description in the database
    update_result = await conversations_collection.update_one(
        {"user_id": user_id, "conversation_id": conversation_id},
        {"$set": {"starred": body.starred}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Conversation not found or update failed"
        )

    # Invalidate Redis cache
    await delete_cache(f"conversations_cache:{user_id}")

    return JSONResponse(
        content={
            "message": "Conversation updated successfully",
            "starred": body.starred,
        }
    )


@router.delete("/conversations")
async def delete_all_conversations(user: dict = Depends(get_current_user)):
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

    # Invalidate Redis cache
    await delete_cache(f"conversations_cache:{user_id}")

    return {
        "message": "All conversations deleted successfully",
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str, user: dict = Depends(get_current_user)
):
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

    # Invalidate Redis cache
    await delete_cache(f"conversations_cache:{user_id}")

    return {
        "message": "Conversation deleted successfully",
        "conversation_id": conversation_id,
    }


@router.put("/conversations/{conversation_id}/messages/{message_id}/pin")
async def pin_message(
    conversation_id: str,
    message_id: str,
    body: PinnedUpdate,
    user: dict = Depends(get_current_user),
):
    """
    Pin a message within a conversation by its message ID.

    Args:
        conversation_id (str): The ID of the conversation containing the message.
        message_id (str): The ID of the message to pin.
        body (PinnedUpdate): A body containing the 'pinned' boolean.

    Returns:
        JSONResponse: The response containing a success message.
    """
    user_id = user.get("user_id")

    try:
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
            raise HTTPException(
                status_code=404, detail="Message not found in conversation"
            )

        update_result = await conversations_collection.update_one(
            {
                "user_id": user_id,
                "conversation_id": conversation_id,
                "messages.message_id": message_id,
            },
            {"$set": {"messages.$.pinned": body.pinned}},
        )

        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=404, detail="Message not found or update failed"
            )

        response_message = (
            f"Message with ID {message_id} pinned successfully"
            if body.pinned
            else f"Message with ID {message_id} unpinned successfully"
        )

        return JSONResponse(
            content={
                "message": response_message,
                "pinned": body.pinned,
            }
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while pinning the message",
        )


@router.get("/messages/pinned")
async def get_starred_messages(user: dict = Depends(get_current_user)):
    """
    Fetch all starred (pinned) messages across all conversations for the authenticated user.

    Args:
        user (dict): The current authenticated user.

    Returns:
        JSONResponse: The response containing the list of pinned messages from all conversations.
    """
    user_id = user.get("user_id")

    results = await conversations_collection.aggregate(
        [
            {"$match": {"user_id": user_id}},
            {"$unwind": "$messages"},
            {"$match": {"messages.pinned": True}},
            {
                "$project": {
                    "_id": 0,
                    "conversation_id": 1,
                    "message": "$messages",
                }
            },
            # Optionally, sort the results (by conversation_id or other fields)
            # {"$sort": {"conversation_id": 1}},
        ]
    ).to_list(None)

    # Check if there are no starred messages
    if not results:
        raise HTTPException(
            status_code=404, detail="No pinned messages found across any conversation"
        )

    return JSONResponse(content={"results": results})
