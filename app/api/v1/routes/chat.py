from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.services.chat_service import (
    chat_stream,
    get_starred_messages,
)

from app.models.general_models import (
    MessageRequestWithHistory,
)

router = APIRouter()


@router.post("/chat-stream")
async def chat_stream_endpoint(
    body: MessageRequestWithHistory,
    # request: Request,
    user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """
    Stream chat messages in real time.

    This endpoint processes user messages through a pipeline that can:
    - Fetch relevant notes and documents
    - Perform web searches when search_web=True
    - Perform deep internet search when deep_search=True, which fetches and
      processes full webpage content from search results
    - Stream AI responses back to the client

    The deep_search feature enhances the search_web functionality by not only
    returning search results but also fetching the actual content from the top
    results, converting it to markdown, and providing it to the LLM for a more
    comprehensive response.
    """

    # TODO: Figure out a better way to get the user's IP address
    # if settings.ENV == "development":
    #     client_ip = settings.DUMMY_IP
    # else:
    #     forwarded = request.headers.get("X-Forwarded-For")
    #     client_ip = forwarded.split(",")[0] if forwarded else request.client.host

    return StreamingResponse(
        chat_stream(body=body, user=user),
        media_type="text/event-stream",
    )


@router.get("/messages/pinned")
async def get_starred_messages_endpoint(
    user: dict = Depends(get_current_user),
) -> JSONResponse:
    """
    Retrieve all pinned messages across all conversations.
    """
    response = await get_starred_messages(user)
    return JSONResponse(content=response)
