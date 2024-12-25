from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from bson import ObjectId
import logging
from fastapi.encoders import jsonable_encoder
from app.db.redis import redis_cache
from app.models.conversations import ConversationModel, UpdateMessagesRequest
from app.middleware.auth import get_current_user
from app.db.connect import conversations_collection, users_collection
from app.services.llm import doPromptNoStream, doPromptWithStreamAsync
from app.schemas.common import (
    MessageRequest,
    DescriptionUpdateRequest,
    MessageRequestWithHistory,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/chat-stream")
async def chat_stream(request: MessageRequestWithHistory):
    """
    Stream chat messages in real-time.

    Args:
        request (MessageRequestWithHistory): Request containing a message and conversation history.

    Returns:
        StreamingResponse: Streamed response for real-time communication.
    """
    return StreamingResponse(
        doPromptWithStreamAsync(request.message, jsonable_encoder(request.messages)),
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

    Args:
        conversation (ConversationModel): Conversation details to be added.
        user (dict): Authenticated user information.

    Returns:
        dict: Created conversation ID and user ID.
    """
    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
        )

    # Check if user exists
    if not await users_collection.find_one({"_id": ObjectId(user_id)}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Invalidate Redis cache
    cache_key = f"conversations_cache:{user_id}"
    await redis_cache.delete(cache_key)

    # Insert conversation into the database
    conversation_data = conversation.model_dump(exclude={"messages"})
    update_result = await conversations_collection.update_one(
        {"user_id": user_id},
        {"$push": {"conversationHistory": conversation_data}},
        upsert=True,
    )

    if not (update_result.modified_count or update_result.upserted_id):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or update conversation",
        )

    return {"conversation_id": conversation_data["conversation_id"], "user_id": user_id}


@router.delete("/conversations")
async def delete_all_conversations(user: dict = Depends(get_current_user)):
    """
    Delete all conversations for the authenticated user.

    Args:
        user (dict): Authenticated user information.

    Returns:
        dict: Confirmation message.
    """
    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
        )

    # Verify user existence
    if not await users_collection.find_one({"_id": ObjectId(user_id)}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Delete all conversations and invalidate cache
    await conversations_collection.update_one(
        {"user_id": user_id}, {"$unset": {"conversationHistory": ""}}
    )
    await redis_cache.delete(f"conversations_cache:{user_id}")

    return {"detail": "All conversations deleted successfully"}


@router.put("/conversations/{conversation_id}/messages")
async def update_messages(
    request: UpdateMessagesRequest, user: dict = Depends(get_current_user)
):
    """
    Add messages to an existing conversation.

    Args:
        request (UpdateMessagesRequest): Request containing conversation ID and new messages.
        user (dict): Authenticated user information.

    Returns:
        dict: Confirmation message.
    """
    user_id = user.get("user_id")
    conversation_id = request.conversation_id
    messages = [message.dict(exclude={"loading"}) for message in request.messages]

    update_result = await conversations_collection.update_one(
        {"user_id": user_id, "conversationHistory.conversation_id": conversation_id},
        {"$push": {"conversationHistory.$.messages": {"$each": messages}}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user",
        )

    # Invalidate Redis cache
    await redis_cache.delete(f"conversations_cache:{user_id}")

    return {"conversation_id": conversation_id, "message": "Messages updated"}


@router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    """
    Fetch all conversations for the authenticated user.

    Args:
        user (dict): Authenticated user information.

    Returns:
        dict: List of conversations.
    """
    user_id = user["user_id"]
    cache_key = f"conversations_cache:{user_id}"

    # Check cache for conversations
    cached_conversations = await redis_cache.get(cache_key)
    if cached_conversations:
        return {"conversations": cached_conversations}

    # Fetch conversations from the database
    user_conversations = await conversations_collection.find_one(
        {"user_id": user_id},
        {
            "conversationHistory.conversation_id": 1,
            "conversationHistory.description": 1,
        },
    )

    if not user_conversations:
        await redis_cache.set(cache_key, [])
        return {"conversations": []}

    conversations = [
        {
            "conversation_id": history["conversation_id"],
            "description": history.get("description", "New Chat"),
        }
        for history in user_conversations.get("conversationHistory", [])
    ]

    # Cache the result
    await redis_cache.set(cache_key, conversations)
    return {"conversations": conversations}


@router.get("/conversations/{conversation_id}/")
async def get_conversation(
    conversation_id: str, user: dict = Depends(get_current_user)
):
    """
    Fetch a specific conversation by ID.

    Args:
        conversation_id (str): Conversation ID.
        user (dict): Authenticated user information.

    Returns:
        dict: Conversation details.
    """
    user_id = user.get("user_id")
    conversation = await conversations_collection.find_one(
        {"user_id": user_id, "conversationHistory.conversation_id": conversation_id}
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user",
        )

    for history in conversation.get("conversationHistory", []):
        if history["conversation_id"] == conversation_id:
            return history

    raise HTTPException(status_code=404, detail="Conversation not found in history")


@router.put("/conversations/{conversation_id}/description/")
async def update_conversation_description(
    conversation_id: str,
    data: DescriptionUpdateRequest,
    user: dict = Depends(get_current_user),
):
    """
    Update the description of a conversation.

    Args:
        conversation_id (str): Conversation ID.
        data (DescriptionUpdateRequest): Request containing a new description.
        user (dict): Authenticated user information.

    Returns:
        JSONResponse: Confirmation message and updated description.
    """
    user_id = user.get("user_id")

    # Verify user existence
    if not await users_collection.find_one({"_id": ObjectId(user_id)}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Generate a summary for the description
    response = await doPromptNoStream(
        prompt=f"Summarize: '{data.userFirstMessage}' in 3-4 words.",
        max_tokens=7,
    )
    description = response.get("response", "New Chat")

    # Update the description in the database
    update_result = await conversations_collection.update_one(
        {
            "user_id": user_id,
            "conversationHistory.conversation_id": conversation_id,
        },
        {"$set": {"conversationHistory.$.description": description}},
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


@router.delete("/conversations/{conversation_id}/")
async def delete_conversation(
    conversation_id: str, user: dict = Depends(get_current_user)
):
    """
    Delete a specific conversation by ID.

    Args:
        conversation_id (str): Conversation ID to be deleted.
        user (dict): Authenticated user information.

    Returns:
        dict: Confirmation message and deleted conversation ID.
    """
    user_id = user.get("user_id")

    update_result = await conversations_collection.update_one(
        {"user_id": user_id},
        {"$pull": {"conversationHistory": {"conversation_id": conversation_id}}},
    )

    if update_result.modified_count == 0:
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
