from datetime import datetime, timezone
import json
from typing import AsyncGenerator, Optional

from fastapi import BackgroundTasks

from app.langchain.agent import call_agent
from app.models.chat_models import MessageModel, UpdateMessagesRequest
from app.models.message_models import MessageRequestWithHistory
from app.services.conversation_service import update_messages
from app.utils.chat_utils import create_conversation


async def chat_stream(
    body: MessageRequestWithHistory,
    user: dict,
    background_tasks: BackgroundTasks,
) -> AsyncGenerator:
    """
    Stream chat messages in real-time.

    Returns:
        StreamingResponse: A streaming response containing the LLM's generated content
    """

    complete_message = ""
    conversation_id, init_chunk = await initialize_conversation(body, user)

    if init_chunk:  # Return the conversation id and metadata if new convo
        yield init_chunk

    # TODO: FETCH NOTES AND FILES AND USE THEM
    async for chunk in call_agent(
        request=body,
        user=user,
        conversation_id=conversation_id,
        access_token=user.get("access_token"),
    ):
        if chunk.startswith("nostream: "):
            # So that we can return data that doesn't need to be streamed
            chunk_json = json.loads(chunk.replace("nostream: ", ""))
            complete_message = chunk_json.get("complete_message", "")
        else:
            yield chunk

    update_conversation_messages(
        background_tasks, body, user, conversation_id, complete_message
    )


async def initialize_conversation(
    body: MessageRequestWithHistory, user: dict
) -> tuple[str, Optional[str]]:
    """
    Initialize a conversation or use an existing one.
    """
    conversation_id = body.conversation_id or None
    init_chunk = None

    if conversation_id is None:
        last_message = body.messages[-1] if body.messages else None
        conversation = await create_conversation(last_message=last_message, user=user)
        conversation_id = conversation.get("conversation_id", "")

        init_chunk = f"""data: {
            json.dumps(
                {
                    "conversation_id": conversation_id,
                    "conversation_description": conversation.get("description"),
                }
            )
        }\n\n"""

    return conversation_id, init_chunk


def update_conversation_messages(
    background_tasks: BackgroundTasks,
    body: MessageRequestWithHistory,
    user: dict,
    conversation_id: str,
    complete_message: str,
) -> None:
    """
    Schedule conversation update in the background.
    """
    background_tasks.add_task(
        update_messages,
        UpdateMessagesRequest(
            conversation_id=conversation_id,
            messages=[
                MessageModel(
                    type="user",
                    response=body.messages[-1]["content"],
                    date=datetime.now(timezone.utc).isoformat(),
                    searchWeb=body.search_web,
                    deepSearchWeb=body.deep_search,
                    pageFetchURLs=body.pageFetchURLs,
                    fileIds=body.fileIds,
                ),
                MessageModel(
                    type="bot",
                    response=complete_message,
                    date=datetime.now(timezone.utc).isoformat(),
                    searchWeb=body.search_web,
                    deepSearchWeb=body.deep_search,
                    pageFetchURLs=body.pageFetchURLs,
                    fileIds=body.fileIds,
                ),
            ],
        ),
        user=user,
    )
