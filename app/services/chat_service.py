import json
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Optional

from fastapi import BackgroundTasks

from app.config.loggers import chat_logger as logger
from app.langchain.agent import call_agent
from app.models.chat_models import MessageModel, UpdateMessagesRequest
from app.models.message_models import MessageRequestWithHistory
from app.services.conversation_service import update_messages
from app.services.file_service import get_files
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

    # Dictionary to collect tool outputs during streaming
    tool_data: Dict[str, Any] = {}

    if init_chunk:  # Return the conversation id and metadata if new convo
        yield init_chunk

    logger.info(
        f"User {user.get('user_id')} started a conversation with ID {conversation_id}"
    )
    logger.info(
        f"User {user.get('user_id')} sent a message: {body.messages[-1]['content']}"
    )
    logger.info(f"Files: {body.fileIds}")

    # Stream response from the agent
    async for chunk in call_agent(
        request=body,
        user=user,
        conversation_id=conversation_id,
        access_token=user.get("access_token"),
    ):
        # Process complete message marker
        if chunk.startswith("nostream: "):
            # So that we can return data that doesn't need to be streamed
            chunk_json = json.loads(chunk.replace("nostream: ", ""))
            complete_message = chunk_json.get("complete_message", "")
        # Process data chunk - potentially contains tool outputs
        elif chunk.startswith("data: "):
            try:
                # Extract tool data from the chunk
                new_data = extract_tool_data(chunk[6:])
                if new_data:
                    tool_data.update(new_data)
            except Exception as e:
                logger.error(f"Error extracting tool data: {e}")
            yield chunk
        # Pass through other chunks
        else:
            yield chunk

    # Save the conversation once streaming is complete
    update_conversation_messages(
        background_tasks, body, user, conversation_id, complete_message, tool_data
    )


def extract_tool_data(json_str: str) -> Dict[str, Any]:
    """
    Extract structured data from tool response JSON.

    Args:
        json_str: The JSON string to parse

    Returns:
        Dictionary with extracted tool data
    """
    try:
        data = json.loads(json_str)
        tool_data: Dict[str, Any] = {}

        # Extract calendar data
        if (
            "intent" in data
            and data["intent"] == "calendar"
            and "calendar_options" in data
        ):
            tool_data["intent"] = "calendar"
            tool_data["calendar_options"] = data["calendar_options"]

        # Extract search results
        elif "search_results" in data:
            tool_data["search_results"] = data["search_results"]

        # Extract deep search results
        elif "deep_search_results" in data:
            tool_data["deep_search_results"] = data["deep_search_results"]

        # Extract weather data
        elif (
            "intent" in data and data["intent"] == "weather" and "weather_data" in data
        ):
            tool_data["intent"] = "weather"
            tool_data["weather_data"] = data["weather_data"]

        # Extract image generation data
        elif (
            "intent" in data
            and data["intent"] == "generate_image"
            and "image_data" in data
        ):
            tool_data["intent"] = "generate_image"
            tool_data["image_data"] = data["image_data"]

        return tool_data
    except json.JSONDecodeError:
        return {}


async def initialize_conversation(
    body: MessageRequestWithHistory, user: dict
) -> tuple[str, Optional[str]]:
    """
    Initialize a conversation or use an existing one.

    Args:
        body: The request body
        user: User information

    Returns:
        Tuple of conversation ID and initialization chunk (if any)
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

    # Load files and old messages if conversation_id is provided
    uploaded_files = await get_files(
        user_id=user.get("user_id"),
        conversation_id=conversation_id,
    )

    if uploaded_files:
        body.fileData = uploaded_files
        body.fileIds = [file.fileId for file in uploaded_files]

    return conversation_id, init_chunk


def update_conversation_messages(
    background_tasks: BackgroundTasks,
    body: MessageRequestWithHistory,
    user: dict,
    conversation_id: str,
    complete_message: str,
    tool_data: Dict[str, Any] = {},
) -> None:
    """
    Schedule conversation update in the background.

    Args:
        background_tasks: FastAPI background task handler
        body: Request body
        user: User information
        conversation_id: ID of the conversation to update
        complete_message: Complete LLM-generated message
        tool_data: Structured tool output data to store with the message
    """
    # Create user message
    user_message = MessageModel(
        type="user",
        response=body.messages[-1]["content"],
        date=datetime.now(timezone.utc).isoformat(),
        searchWeb=body.search_web,
        deepSearchWeb=body.deep_search,
        pageFetchURLs=body.pageFetchURLs,
        fileIds=body.fileIds,
    )

    # Create bot message with base properties
    bot_message = MessageModel(
        type="bot",
        response=complete_message,
        date=datetime.now(timezone.utc).isoformat(),
        searchWeb=body.search_web,
        deepSearchWeb=body.deep_search,
        pageFetchURLs=body.pageFetchURLs,
        fileIds=body.fileIds,
    )

    # Apply tool data fields to bot message if available
    if tool_data:
        # Use dictionary unpacking for cleaner application of fields
        for key, value in tool_data.items():
            setattr(bot_message, key, value)

    # Schedule the DB update as a background task
    background_tasks.add_task(
        update_messages,
        UpdateMessagesRequest(
            conversation_id=conversation_id,
            messages=[user_message, bot_message],
        ),
        user=user,
    )
