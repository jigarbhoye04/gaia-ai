from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse

from app.api.v1.dependencies.oauth_dependencies import (
    get_current_user,
    get_user_timezone,
)
from app.models.message_models import MessageRequestWithHistory
from app.services.chat_service import chat_stream

router = APIRouter()


@router.post("/chat-stream")
async def chat_stream_endpoint(
    body: MessageRequestWithHistory,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    user_time: datetime = Depends(get_user_timezone),
) -> StreamingResponse:
    """
    Stream chat messages in real time.
    """

    # TODO: Figure out a better way to get the user's IP address
    # if settings.ENV == "development":
    #     client_ip = settings.DUMMY_IP
    # else:
    #     forwarded = request.headers.get("X-Forwarded-For")
    #     client_ip = forwarded.split(",")[0] if forwarded else request.client.host

    return StreamingResponse(
        chat_stream(
            body=body, user=user, background_tasks=background_tasks, user_time=user_time
        ),
        media_type="text/event-stream",
    )
