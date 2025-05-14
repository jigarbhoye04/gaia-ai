import json
from datetime import datetime, timezone

from langchain_core.messages import AIMessageChunk, ToolMessage
from langsmith import traceable

from app.config.loggers import llm_logger as logger
from app.langchain.graph_manager import GraphManager
from app.langchain.messages import construct_langchain_messages
from app.models.message_models import MessageRequestWithHistory
from app.utils.sse_utils import format_tool_response


@traceable
async def call_agent(
    request: MessageRequestWithHistory,
    conversation_id,
    user,
    access_token=None,
    refresh_token=None,
):
    user_id = user.get("user_id")
    messages = request.messages
    complete_message = ""
    history = construct_langchain_messages(messages)

    initial_state = {
        "query": request.message,
        "messages": history,
        "force_web_search": request.search_web,
        "force_deep_search": request.deep_search,
        "current_datetime": datetime.now(timezone.utc).isoformat(),
    }

    try:
        graph = await GraphManager.get_graph()

        async for event in graph.astream(
            initial_state,
            stream_mode=["messages", "custom"],
            config={
                "configurable": {
                    "thread_id": conversation_id,
                    "user_id": user_id,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                },
                "recursion_limit": 10,
                "metadata": {"user_id": user_id},
            },
        ):
            print(access_token, refresh_token)
            stream_mode, payload = event
            if stream_mode == "messages":
                chunk, metadata = payload
                if chunk is None:
                    continue

                if isinstance(chunk, AIMessageChunk):
                    content = str(chunk.content)
                    if content:
                        yield f"data: {json.dumps({'response': content})}\n\n"
                        complete_message += content

                elif isinstance(chunk, ToolMessage):
                    logger.info(f"Tool message: {chunk.name} - {chunk.content}")
                    yield format_tool_response(
                        tool_name=chunk.name, content=str(chunk.content)
                    )

            elif stream_mode == "custom":
                yield f"data: {json.dumps(payload)}\n\n"

        yield f"nostream: {json.dumps({'complete_message': complete_message})}"
        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        yield "data: {'error': 'Error fetching messages'}\n\n"
        yield "data: [DONE]\n\n"
