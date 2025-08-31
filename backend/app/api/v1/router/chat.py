from datetime import datetime

from app.middleware.agent_auth import create_agent_token
from fastapi import APIRouter, BackgroundTasks, Depends
from typing import Optional
from fastapi.responses import StreamingResponse

from app.api.v1.dependencies.oauth_dependencies import (
    get_current_user,
    get_user_timezone,
)
from app.decorators import tiered_rate_limit
from app.models.message_models import MessageRequestWithHistory
from app.services.chat_service import chat_stream

import json
from livekit import api
from app.config.settings import settings
import uuid

router = APIRouter()


@router.post("/chat-stream")
@tiered_rate_limit("chat_messages")
async def chat_stream_endpoint(
    body: MessageRequestWithHistory,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    user_time: datetime = Depends(get_user_timezone),
) -> StreamingResponse:
    """
    Stream chat messages in real time.
    """

    return StreamingResponse(
        chat_stream(
            body=body, user=user, background_tasks=background_tasks, user_time=user_time
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/token")
def get_token(
    user: dict = Depends(get_current_user),
    conversationId: Optional[str] = None,
):
    user_id = user.get("user_id")
    user_email: str = user.get("email", "")
    if not user_id or not isinstance(user_id, str):
        return ("Invalid or missing user_id")
    room_name = f"voice_session_{user_id}_{uuid.uuid4().hex[:8]}"

    identity = f"user_{user_id}"
    display_name = user_email
    agent_jwt = create_agent_token(user_id)
    metadata = {
        "identity": identity,
        "name": display_name,
        "agentToken": agent_jwt,
        "roomName": room_name,
    }
    if conversationId:
        metadata["conversationId"] = conversationId
    at = (
        api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        .with_identity(identity)
        .with_name(display_name)
        .with_metadata(json.dumps(metadata))
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
                can_update_own_metadata=True,
            )
        )
    )

    return {
        "serverUrl": settings.LIVEKIT_URL,
        "roomName": room_name,
        "participantToken": at.to_jwt(),
        "participantIdentity": identity,
        "participantName": display_name,
        "agentToken": agent_jwt,
        "conversation_id": conversationId
    }