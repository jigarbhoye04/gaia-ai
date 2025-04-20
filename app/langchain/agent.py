import json
from datetime import datetime, timezone

from langchain_core.messages import AIMessageChunk, ToolMessage

from app.config.loggers import llm_logger as logger
from app.langchain.graph_builder import build_graph
from app.langchain.messages import (
    add_file_content_to_message,
    construct_langchain_messages,
)
from app.models.chat_models import MessageModel, UpdateMessagesRequest
from app.models.general_models import MessageRequestWithHistory
from app.services.conversation_service import update_messages
from app.utils.sse_utils import format_tool_response

graph = build_graph()


async def call_agent(
    message_request: MessageRequestWithHistory,
    conversation_id,
    user,
    access_token=None,
):
    user_id = user.get("user_id")
    messages = message_request.messages

    messages[-1] = await add_file_content_to_message(
        messages[-1], message_request.fileIds, user_id
    )
    history = construct_langchain_messages(messages)

    initial_state = {
        "messages": history,
        "force_web_search": False,
        "force_deep_search": False,
        "current_datetime": datetime.now(timezone.utc).isoformat(),
    }

    llm_message = ""
    try:
        async for event in graph.astream(
            initial_state,
            stream_mode=["messages"],
            config={
                "configurable": {
                    "thread_id": conversation_id,
                    "user_id": user_id,
                    "access_token": access_token,
                },
                "recursion_limit": 10,
                "metadata": {"user_id": user_id},
            },
        ):
            # Unpack the properties from the event
            _, (chunk, _metadata) = event

            # If the chunk is a message from the agent
            if isinstance(chunk, AIMessageChunk):
                yield f"data: {json.dumps({'response': chunk.content})}\n\n"

                llm_message += chunk.content

            # If the chunk is output of a tool
            elif isinstance(chunk, ToolMessage):
                try:
                    yield format_tool_response(
                        tool_name=chunk.name,
                        content=str(chunk.content),
                    )
                except Exception as e:
                    logger.error(f"Tool formatting error: {e}")
                    yield f"data: {{'error': 'Error processing {chunk.name}'}}\n\n"

        # Signal completion of the stream
        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {{'error': '{e}'}}\n\n"
        yield "data: [DONE]\n\n"

    try:
        # Handle storing the conversation and updating the database here
        await update_messages(
            UpdateMessagesRequest(
                conversation_id=conversation_id,
                messages=[
                    MessageModel(
                        type="user",
                        response=messages[-1]["content"],
                        date=datetime.now(timezone.utc).isoformat(),
                        searchWeb=message_request.search_web,
                        deepSearchWeb=message_request.deep_search,
                        pageFetchURLs=message_request.pageFetchURLs,
                        fileIds=message_request.fileIds,
                    ),
                    MessageModel(
                        type="bot",
                        response=llm_message,
                        date=datetime.now(timezone.utc).isoformat(),
                        searchWeb=message_request.search_web,
                        deepSearchWeb=message_request.deep_search,
                        pageFetchURLs=message_request.pageFetchURLs,
                        fileIds=message_request.fileIds,
                    ),
                ],
            ),
            user=user,
        )
    except Exception as e:
        logger.error(f"Error updating messages: {e}")
        yield "data: {'error': 'Error updating messages'}\n\n"
        yield "data: [DONE]\n\n"
