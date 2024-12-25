from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
from app.services.llm import (
    doPromptNoStream,
    doPromptWithStreamAsync,
    doPromptNoStreamAsync,
)
from app.models.conversations import ConversationModel, UpdateMessagesRequest
from app.middleware.auth import get_current_user
from app.db.connect import conversations_collection, users_collection
from app.schemas.common import (
    MessageRequest,
    DescriptionUpdateRequest,
    MessageRequestWithHistory,
)

router = APIRouter()


@router.post("/chat-stream")
async def chat_stream(request: MessageRequestWithHistory):
    print(jsonable_encoder(request.messages))

    return StreamingResponse(
        doPromptWithStreamAsync(request.message, jsonable_encoder(request.messages)),
        media_type="text/event-stream",
    )


@router.post("/chat")
async def chat(request: MessageRequest):
    return JSONResponse(content=await doPromptNoStream(request.message))


@router.post("/conversations")
async def create_conversation(
    conversation: ConversationModel, user_id: str = Depends(get_current_user)
):
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
        )

    user_exists = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    new_conversation = conversation.model_dump()
    new_conversation.pop("messages", None)

    update_result = await conversations_collection.update_one(
        {"user_id": user_id},
        {"$push": {"conversationHistory": new_conversation}},
        upsert=True,
    )

    if update_result.modified_count == 0 and not update_result.upserted_id:
        raise HTTPException(
            status_code=500, detail="Failed to create or update conversation"
        )

    return {"conversation_id": new_conversation["conversation_id"], "user_id": user_id}


@router.delete("/conversations")
async def delete_all_conversations(user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
        )

    user_exists = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    result = await conversations_collection.update_one(
        {"user_id": user_id}, {"$unset": {"conversationHistory": ""}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete conversations")

    return {"detail": "All conversations deleted successfully"}


@router.put("/conversations/{conversation_id}/messages")
async def update_messages(
    request: UpdateMessagesRequest, user_id: str = Depends(get_current_user)
):
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

    return {"conversation_id": conversation_id, "message": "Messages updated"}


@router.get("/conversations")
async def get_conversations(user_id: str = Depends(get_current_user)):
    user_conversations = await conversations_collection.find_one(
        {"user_id": user_id},
        {
            "conversationHistory.conversation_id": 1,
            "conversationHistory.description": 1,
        },
    )

    if not user_conversations:
        return {"conversations": []}

    conversations = [
        {
            "conversation_id": history["conversation_id"],
            "description": history.get("description", "New Chat"),
        }
        for history in user_conversations.get("conversationHistory", [])
    ]

    return {"conversations": conversations}


@router.get("/conversations/{conversation_id}/")
async def get_conversation(
    conversation_id: str, user_id: str = Depends(get_current_user)
):
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
    user_id: str = Depends(get_current_user),
):
    # Verify that the user exists
    user_exists = await users_collection.count_documents({"_id": ObjectId(user_id)}) > 0
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    response = await doPromptNoStream(
        prompt=f"""Summarise what the message/question '{data.userFirstMessage}' is about, in under 3-4 words from a 3rd person perspective. Just respond with the summary. Exclude any double quotes or titles""",
        max_tokens=7,
    )
    description = response.get("response", "New Chat")

    print(description)
    # Find the conversation and update the description
    update_result = await conversations_collection.update_one(
        {
            "user_id": user_id,  # Use the user_id from the dependency
            "conversationHistory.conversation_id": conversation_id,
        },
        {"$set": {"conversationHistory.$.description": description}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Conversation not found or update failed"
        )

    return JSONResponse(
        content={
            "message": "Conversation updated successfully",
            description: description,
        }
    )


@router.delete("/conversations/{conversation_id}/")
async def delete_conversation(
    conversation_id: str, user_id: str = Depends(get_current_user)
):
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
        )

    update_result = await conversations_collection.update_one(
        {"user_id": user_id},
        {"$pull": {"conversationHistory": {"conversation_id": conversation_id}}},
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user",
        )

    return {
        "message": "Conversation deleted successfully",
        "conversation_id": conversation_id,
    }
