from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from schemas.schema_request import MessageRequest
from functionality.text.text import doPrompt, doPromptNoStream
from functionality.text.zero_shot_classification import classify_event_type
from models.models_messages import ConversationModel, ConversationHistoryModel, MessageModel
from schemas.schema_request import UpdateDescriptionRequest
from typing import List
from middleware.middleware_auth import get_current_user
from database.connect import conversations_collection, users_collection
from bson import ObjectId
import datetime

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

    # Remove "loading" from each message if it exists
    for message in new_conversation["messages"]:
        message.pop("loading", None)

    # Check if the user has a document in the conversations collection
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
async def update_messages(conversation_id: str, new_messages: List[MessageModel]):
    update_result = conversations_collection.update_one(
        {"conversation_id": conversation_id},
        {"$push": {"messages": {
            "$each": [message.dict() for message in new_messages]}}}
    )

    if update_result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Conversation not found or no new messages")

    return {"conversation_id": conversation_id, "message": "Messages updated"}


# @router.put("/conversations/{conversation_id}/description/")
# async def update_conversation_description(conversation_id: str, update_request: UpdateDescriptionRequest):
#     if conversation_id not in conversations_db:
#         raise HTTPException(status_code=404, detail="Conversation not found")

#     # Update the conversation description
#     conversations_db[conversation_id]["description"] = update_request.description

#     return {"conversation_id": conversation_id, "new_description": update_request.description}
