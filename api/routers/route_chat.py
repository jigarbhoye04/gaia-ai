from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from schemas.schema_request import MessageRequest, DescriptionUpdateRequest, MessageRequestPrimary
from functionality.text.text import doPrompt, doPromptNoStream
# from functionality.text.zero_shot_classification import classify_event_type
from models.models_messages import ConversationModel, UpdateMessagesRequest
from typing import List
from middleware.middleware_auth import get_current_user
from database.connect import conversations_collection, users_collection
from bson import ObjectId

router = APIRouter()


# def test(key: str):
#     yield f"""data: {{"response": {{"type" : "{key}"}}}}\n\n"""
#     yield """data: [DONE]\n\n"""
# data = await classify_event_type(request.message)

# if(data["generate image"] > 0.75):
#     return StreamingResponse(test("image"), media_type='text/event-stream')
# else:
#     return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')

@router.post("/chat-stream")
async def chat(request: MessageRequest):
    return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')


@router.post("/chat")
def chat(request: MessageRequest):
    return JSONResponse(content=doPromptNoStream(request.message))


@router.post("/conversations/")
async def create_conversation(conversation: ConversationModel, user_id: str = Depends(get_current_user)):
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated"
        )

    user_exists = await users_collection.count_documents({"_id": ObjectId(user_id)}) > 0
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    new_conversation = conversation.model_dump()
    new_conversation["messages"] = [message.model_dump()
                                    for message in conversation.messages]

    for message in new_conversation["messages"]:
        message.pop("loading", None)

    existing_user_conversation = await conversations_collection.find_one({"user_id": user_id})

    if existing_user_conversation:
        conversation_exists = any(
            conv["conversation_id"] == new_conversation["conversation_id"]
            for conv in existing_user_conversation["conversationHistory"]
        )

        if conversation_exists:
            raise HTTPException(
                status_code=400,
                detail="Conversation with this ID already exists."
            )

        update_result = await conversations_collection.update_one(
            {"user_id": user_id},
            {"$push": {"conversationHistory": new_conversation}}
        )
        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=500, detail="Failed to update conversation history"
            )
    else:
        new_document = {
            "user_id": user_id,
            "conversationHistory": [new_conversation]
        }
        result = await conversations_collection.insert_one(new_document)
        if not result.acknowledged:
            raise HTTPException(
                status_code=500, detail="Failed to create conversation"
            )

    return {"conversation_id": new_conversation["conversation_id"], "user_id": user_id}


@router.put("/conversations/{conversation_id}/messages/")
async def update_messages(request: UpdateMessagesRequest, user_id: str = Depends(get_current_user)):
    conversation_id = request.conversation_id
    messages = request.messages

    existing_conversation = await conversations_collection.find_one({
        "user_id": user_id,
        "conversationHistory.conversation_id": conversation_id
    })

    if not existing_conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user"
        )

    update_result = await conversations_collection.update_one(
        {
            "user_id": user_id,
            "conversationHistory.conversation_id": conversation_id
        },
        {
            "$push": {
                "conversationHistory.$.messages": {
                    "$each": [message.dict(exclude={"loading"}) for message in messages]
                }
            }
        }
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="No new messages to update"
        )

    return {"conversation_id": conversation_id, "message": "Messages updated"}


@router.get("/conversations/")
async def get_conversations(user_id: str = Depends(get_current_user)):
    user_conversations = await conversations_collection.find(
        {"user_id": user_id},
        {
            "conversationHistory.conversation_id": 1,
            "conversationHistory.description": 1
        }
    ).to_list(None)

    conversations = []
    for conv in user_conversations:
        for history in conv.get("conversationHistory", []):
            conversations.append({
                "conversation_id": history["conversation_id"],
                "description": history.get("description", "New Chat")
            })

    return {"conversations": conversations}


@router.get("/conversations/{conversation_id}/")
async def get_conversation(conversation_id: str, user_id: str = Depends(get_current_user)):
    conversation = await conversations_collection.find_one({
        "user_id": user_id,
        "conversationHistory.conversation_id": conversation_id
    })

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user"
        )

    for history in conversation.get("conversationHistory", []):
        if history["conversation_id"] == conversation_id:
            return history

    raise HTTPException(
        status_code=404,
        detail="Conversation not found in history"
    )


@router.put("/conversations/{conversation_id}/description/")
async def update_conversation_description(
    conversation_id: str,
    update_request: DescriptionUpdateRequest,
    user_id: str = Depends(get_current_user)
):
    # Verify that the user exists
    user_exists = await users_collection.count_documents({"_id": ObjectId(user_id)}) > 0
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Find the conversation and update the description
    update_result = await conversations_collection.update_one(
        {
            "user_id": user_id,  # Use the user_id from the dependency
            "conversationHistory.conversation_id": conversation_id
        },
        {"$set": {"conversationHistory.$.description": update_request.description}}
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Conversation not found or update failed"
        )

    return JSONResponse(content={"message": "Conversation updated successfully"})


@router.delete("/conversations/{conversation_id}/")
async def delete_conversation(conversation_id: str, user_id: str = Depends(get_current_user)):
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated"
        )

    update_result = await conversations_collection.update_one(
        {
            "user_id": user_id
        },
        {
            "$pull": {
                "conversationHistory": {"conversation_id": conversation_id}
            }
        }
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or does not belong to the user"
        )

    return {"message": "Conversation deleted successfully", "conversation_id": conversation_id}
