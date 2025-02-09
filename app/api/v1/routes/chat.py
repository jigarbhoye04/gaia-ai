# app/api/routers/chat_routes.py
from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from app.api.v1.dependencies.auth import get_current_user
from app.models import StarredUpdate, PinnedUpdate
from app.models.chat_models import ConversationModel, UpdateMessagesRequest
from app.services.chat_service import ChatService
from app.schemas.common_schema import (
    MessageRequest,
    MessageRequestWithHistory,
    DescriptionUpdateRequestLLM,
    DescriptionUpdateRequest,
)


# Create the APIRouter and instantiate the ChatService.
router = APIRouter()
chat_service = ChatService()


@router.post("/chat-stream")
async def chat_stream_endpoint(
    body: MessageRequestWithHistory,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """
    Stream chat messages in real time.

    This endpoint streams chat responses based on the conversation history,
    enriching the context with document notes, search results, or fetched webpage
    content as needed.
    """
    return await chat_service.chat_stream(body, background_tasks, user)


@router.post("/chat")
async def chat_endpoint(request: MessageRequest) -> JSONResponse:
    """
    Return a chat response for the provided message.

    This endpoint obtains a response from the LLM (without streaming).
    """
    response = await chat_service.chat(request)
    return JSONResponse(content=response)


@router.post("/conversations")
async def create_conversation_endpoint(
    conversation: ConversationModel, user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Create a new conversation.

    This endpoint creates a new conversation record for the authenticated user.
    """
    response = await chat_service.create_conversation(conversation, user)
    return JSONResponse(content=response)


@router.get("/conversations")
async def get_conversations_endpoint(
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Retrieve all conversations for the authenticated user.

    This endpoint fetches a list of conversations (using caching when possible).
    """
    response = await chat_service.get_conversations(user)
    return JSONResponse(content=response)


@router.get("/conversations/{conversation_id}")
async def get_conversation_endpoint(
    conversation_id: str, user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Retrieve a specific conversation by its ID.

    This endpoint returns a conversation document if it exists and belongs to the user.
    """
    response = await chat_service.get_conversation(conversation_id, user)
    return JSONResponse(content=response)


@router.put("/conversations/{conversation_id}/messages")
async def update_messages_endpoint(
    request: UpdateMessagesRequest, user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Update the messages of a conversation.

    This endpoint appends new messages to an existing conversation.
    """
    response = await chat_service.update_messages(request, user)
    return JSONResponse(content=response)


@router.put("/conversations/{conversation_id}/description/llm")
async def update_conversation_description_llm_endpoint(
    conversation_id: str,
    data: DescriptionUpdateRequestLLM,
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Update the conversation description using an LLM.

    This endpoint uses an LLM prompt to generate a succinct summary for the conversation.
    """
    response = await chat_service.update_conversation_description_llm(
        conversation_id, data, user
    )
    return JSONResponse(content=response)


@router.put("/conversations/{conversation_id}/description")
async def update_conversation_description_endpoint(
    conversation_id: str,
    data: DescriptionUpdateRequest,
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Update the conversation description.

    This endpoint directly updates the conversation's description based on the provided text.
    """
    response = await chat_service.update_conversation_description(
        conversation_id, data, user
    )
    return JSONResponse(content=response)


@router.put("/conversations/{conversation_id}/star")
async def star_conversation_endpoint(
    conversation_id: str,
    body: StarredUpdate,
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Star or unstar a conversation.

    This endpoint updates the 'starred' status of the specified conversation.
    """
    response = await chat_service.star_conversation(conversation_id, body.starred, user)
    return JSONResponse(content=response)


@router.delete("/conversations")
async def delete_all_conversations_endpoint(
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Delete all conversations for the authenticated user.

    This endpoint removes every conversation associated with the current user.
    """
    response = await chat_service.delete_all_conversations(user)
    return JSONResponse(content=response)


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_endpoint(
    conversation_id: str, user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Delete a specific conversation by its ID.

    This endpoint deletes the conversation if it exists and belongs to the user.
    """
    response = await chat_service.delete_conversation(conversation_id, user)
    return JSONResponse(content=response)


@router.put("/conversations/{conversation_id}/messages/{message_id}/pin")
async def pin_message_endpoint(
    conversation_id: str,
    message_id: str,
    body: PinnedUpdate,
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Pin or unpin a message within a conversation.

    This endpoint updates the 'pinned' status of a specified message in a conversation.
    """
    response = await chat_service.pin_message(
        conversation_id, message_id, body.pinned, user
    )
    return JSONResponse(content=response)


@router.get("/messages/pinned")
async def get_starred_messages_endpoint(
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Retrieve all pinned messages across all conversations.

    This endpoint fetches all messages marked as pinned for the authenticated user.
    """
    response = await chat_service.get_starred_messages(user)
    return JSONResponse(content=response)
