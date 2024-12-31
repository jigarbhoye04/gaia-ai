from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, StreamingResponse
from app.db.connect import conversations_collection
from app.db.redis import redis_cache
from app.services.llm import doPromptWithStreamAsync, doPromptNoStream
from app.middleware.auth import get_current_user
from app.models.conversations import ConversationModel, UpdateMessagesRequest
from app.schemas.common import (
    DescriptionUpdateRequest,
    DescriptionUpdateRequestLLM,
    MessageRequest,
    MessageRequestWithHistory,
)

router = APIRouter()


@router.post("/chat-stream")
async def chat_stream(request: MessageRequestWithHistory):
    """
    Stream chat messages in real-time.

    Args:
        request (MessageRequestWithHistory): Request containing a message and conversation history.

    Returns:
        StreamingResponse: Streamed response for real-time communication.
    """

    print(request.messages)

    return StreamingResponse(
        doPromptWithStreamAsync(
            messages=jsonable_encoder(request.messages), max_tokens=4096
        ),
        media_type="text/event-stream",
    )


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
    """
    Create a new conversation for the authenticated user.
    """
    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
        )

    conversation_data = {
        "user_id": user_id,
        "conversation_id": conversation.conversation_id,
        "description": conversation.description,
        "messages": [],
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

    # Invalidate Redis cache
    await redis_cache.delete(f"conversations_cache:{user_id}")

    return {
        "conversation_id": conversation.conversation_id,
        "user_id": user_id,
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
    cached_conversations = await redis_cache.get(cache_key)
    if cached_conversations:
        return {"conversations": jsonable_encoder(cached_conversations)}

    # Fetch all conversations for the user
    conversations = await conversations_collection.find(
        {"user_id": user_id}, {"_id": 1, "conversation_id": 1, "description": 1}
    ).to_list(None)

    if not conversations:
        await redis_cache.set(cache_key, [])
        return {"conversations": []}

    # Convert ObjectId to string
    for conversation in conversations:
        conversation["_id"] = str(conversation["_id"])

    # Cache the result
    await redis_cache.set(cache_key, jsonable_encoder(conversations))

    return {"conversations": conversations}


@router.get("/conversations/{conversation_id}/")
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
    messages = [message.dict(exclude={"loading"}) for message in request.messages]

    update_result = await conversations_collection.update_one(
        {"user_id": user_id, "conversation_id": conversation_id},
        {"$push": {"messages": {"$each": messages}}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user",
        )

    # Invalidate Redis cache
    await redis_cache.delete(f"conversations_cache:{user_id}")

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
        prompt=f"Summarize: '{data.userFirstMessage}' in 3-4 words.",
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
    await redis_cache.delete(f"conversations_cache:{user_id}")

    return JSONResponse(
        content={
            "message": "Conversation updated successfully",
            "description": description,
        }
    )


@router.put("/conversations/{conversation_id}/description/")
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
    await redis_cache.delete(f"conversations_cache:{user_id}")

    return JSONResponse(
        content={
            "message": "Conversation updated successfully",
            "description": data.description,
        }
    )


@router.delete("/conversations/{conversation_id}/")
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
    await redis_cache.delete(f"conversations_cache:{user_id}")

    return {
        "message": "Conversation deleted successfully",
        "conversation_id": conversation_id,
    }
