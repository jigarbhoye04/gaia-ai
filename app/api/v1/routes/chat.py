# app/api/routers/chat_routes.py
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse, StreamingResponse
from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.services.chat_service import (
    chat_stream,
    chat,
    create_conversation,
    get_conversations,
    get_conversation,
    update_messages,
    update_conversation_description_llm,
    update_conversation_description,
    star_conversation,
    delete_all_conversations,
    delete_conversation,
    pin_message,
    get_starred_messages,
)
from app.models.chat_models import (
    ConversationModel,
    UpdateMessagesRequest,
    StarredUpdate,
    PinnedUpdate,
)
from app.models.general_models import (
    MessageRequest,
    MessageRequestWithHistory,
    DescriptionUpdateRequestLLM,
    DescriptionUpdateRequest,
)

router = APIRouter()


@router.post("/chat-stream")
async def chat_stream_endpoint(
    body: MessageRequestWithHistory,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    llm_model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
) -> StreamingResponse:
    """
    Stream chat messages in real time.
    """
    return await chat_stream(body, background_tasks, user, llm_model)


@router.post("/chat")
async def chat_endpoint(request: MessageRequest) -> JSONResponse:
    """
    Return a chat response for the provided message.
    """
    response = await chat(request)
    return JSONResponse(content=response)


@router.post("/conversations")
async def create_conversation_endpoint(
    conversation: ConversationModel, user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Create a new conversation.
    """
    response = await create_conversation(conversation, user)
    return JSONResponse(content=response)


@router.get("/conversations")
async def get_conversations_endpoint(
    user: dict = Depends(get_current_user),
    page: int = Query(
        1, alias="page", ge=1, description="Page number (starting from 1)"
    ),
    limit: int = Query(
        10,
        alias="limit",
        ge=1,
        le=100,
        description="Number of conversations per page (1-100)",
    ),
) -> JSONResponse:
    """
    Retrieve paginated conversations for the authenticated user.
    """
    response = await get_conversations(user, page=page, limit=limit)
    return JSONResponse(content=response)


@router.get("/conversations/{conversation_id}")
async def get_conversation_endpoint(
    conversation_id: str, user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Retrieve a specific conversation by its ID.
    """
    response = await get_conversation(conversation_id, user)
    return JSONResponse(content=response)


@router.put("/conversations/{conversation_id}/messages")
async def update_messages_endpoint(
    request: UpdateMessagesRequest, user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Update the messages of a conversation.
    """
    response = await update_messages(request, user)
    return JSONResponse(content=response)


@router.put("/conversations/{conversation_id}/description/llm")
async def update_conversation_description_llm_endpoint(
    conversation_id: str,
    data: DescriptionUpdateRequestLLM,
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Update the conversation description using an LLM.
    """
    response = await update_conversation_description_llm(
        conversation_id=conversation_id, data=data, user=user, model=data.model
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
    """
    response = await update_conversation_description(conversation_id, data, user)
    return JSONResponse(content=response)


@router.put("/conversations/{conversation_id}/star")
async def star_conversation_endpoint(
    conversation_id: str,
    body: StarredUpdate,
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Star or unstar a conversation.
    """
    response = await star_conversation(conversation_id, body.starred, user)
    return JSONResponse(content=response)


@router.delete("/conversations")
async def delete_all_conversations_endpoint(
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Delete all conversations for the authenticated user.
    """
    response = await delete_all_conversations(user)
    return JSONResponse(content=response)


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_endpoint(
    conversation_id: str, user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Delete a specific conversation by its ID.
    """
    response = await delete_conversation(conversation_id, user)
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
    """
    response = await pin_message(conversation_id, message_id, body.pinned, user)
    return JSONResponse(content=response)


@router.get("/messages/pinned")
async def get_starred_messages_endpoint(
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Retrieve all pinned messages across all conversations.
    """
    response = await get_starred_messages(user)
    return JSONResponse(content=response)
