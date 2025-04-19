import json
from datetime import datetime, timezone
from langchain_core.messages import AIMessageChunk, ToolMessage
from app.langchain.messages import construct_langchain_messages
from app.langchain.graph_builder import build_graph
from app.config.loggers import llm_logger as logger
from app.utils.sse_utils import format_tool_response


graph = build_graph()


async def call_agent(messages, conversation_id, user_id, access_token=None):
    history = construct_langchain_messages(messages)
    initial_state = {
        "messages": history,
        "force_web_search": False,
        "force_deep_search": False,
        "current_datetime": datetime.now(timezone.utc).isoformat(),
    }

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
