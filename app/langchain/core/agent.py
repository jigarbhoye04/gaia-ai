import asyncio
import json
from datetime import datetime, timezone

from app.config.loggers import llm_logger as logger
from app.langchain.core.graph_manager import GraphManager
from app.langchain.core.messages import construct_langchain_messages
from app.models.message_models import MessageRequestWithHistory
from app.utils.memory_utils import store_user_message_memory
from langchain_core.messages import AIMessageChunk
from langsmith import traceable


@traceable
async def call_agent(
    request: MessageRequestWithHistory,
    conversation_id,
    user,
    access_token=None,
    refresh_token=None,
    background_tasks=None,
):
    user_id = user.get("user_id")
    messages = request.messages
    complete_message = ""
    memory_stored_event = asyncio.Event()

    async def store_memory():
        """Store memory in background and signal completion."""
        try:
            if user_id and request.message:
                memory_data = await store_user_message_memory(
                    user_id, request.message, conversation_id
                )
                return memory_data
        except Exception as e:
            logger.error(f"Error in background memory storage: {e}")
        finally:
            memory_stored_event.set()  # Always signal completion
        return None

    try:
        # First gather: Setup operations that can run in parallel
        history, graph = await asyncio.gather(
            construct_langchain_messages(
                messages,
                files_data=request.fileData,
                currently_uploaded_file_ids=request.fileIds,
                user_id=user_id,
                query=request.message,
                user_name=user.get("name"),
            ),
            GraphManager.get_graph(),
        )

        # Start memory storage in background
        memory_task = asyncio.create_task(store_memory())

        initial_state = {
            "query": request.message,
            "messages": history,
            "force_web_search": request.search_web,
            "force_deep_search": request.deep_search,
            "current_datetime": datetime.now(timezone.utc).isoformat(),
            "mem0_user_id": user_id,
            "conversation_id": conversation_id,
        }

        # Begin streaming the AI output
        async for event in graph.astream(
            initial_state,
            stream_mode=["messages", "custom"],
            config={
                "configurable": {
                    "thread_id": conversation_id,
                    "user_id": user_id,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "email": user.get("email"),
                },
                "recursion_limit": 15,
                "metadata": {"user_id": user_id},
            },
        ):
            stream_mode, payload = event
            if stream_mode == "messages":
                chunk, metadata = payload
                if chunk is None:
                    continue

                # If we remove this check, all tool outputs will be yielded
                if isinstance(chunk, AIMessageChunk):
                    content = str(chunk.content)
                    if content:
                        yield f"data: {json.dumps({'response': content})}\n\n"
                        complete_message += content

            elif stream_mode == "custom":
                yield f"data: {json.dumps(payload)}\n\n"

        # After streaming, yield complete message in order to store in db
        yield f"nostream: {json.dumps({'complete_message': complete_message})}"

        # Wait until memory is stored before yielding the confirmation
        await memory_stored_event.wait()
        # Get the memory result and yield if successful
        memory_data = await memory_task
        if memory_data:
            yield f"data: {json.dumps({'memory_data': memory_data})}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Error when calling agent: {e}")
        yield "data: {'error': 'Error when calling agent:  {e}'}\n\n"
        yield "data: [DONE]\n\n"
