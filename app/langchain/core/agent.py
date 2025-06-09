import json
from datetime import datetime, timezone

from app.config.loggers import llm_logger as logger
from app.langchain.core.graph_manager import GraphManager
from app.langchain.core.messages import construct_langchain_messages
from app.models.message_models import MessageRequestWithHistory
from app.utils.memory_utils import (
    await_remaining_memory_task,
    check_memory_task_yield,
    start_memory_task,
)
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
    memory_yielded = False
    memory_task = None

    try:
        # Construct LangChain messages with memory retrieval
        history = await construct_langchain_messages(
            messages,
            files_data=request.fileData,
            currently_uploaded_file_ids=request.fileIds,
            user_id=user_id,
            query=request.message,
            user_name=user.get("name"),
        )

        graph = await GraphManager.get_graph()

        initial_state = {
            "query": request.message,
            "messages": history,
            "force_web_search": request.search_web,
            "force_deep_search": request.deep_search,
            "current_datetime": datetime.now(timezone.utc).isoformat(),
            "mem0_user_id": user_id,
            "conversation_id": conversation_id,
        }

        # Start memory storage in parallel
        memory_task = start_memory_task(user_id, request.message, conversation_id)

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
            # Check if memory task is done and yield result
            memory_data, memory_yielded = check_memory_task_yield(memory_task, memory_yielded)
            if memory_data:
                yield f"data: {json.dumps({'memory_data': memory_data})}\n\n"

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

        # Yield memory data if task completed after streaming finished
        remaining_memory_data = await await_remaining_memory_task(memory_task, memory_yielded)
        if remaining_memory_data:
            yield f"data: {json.dumps({'memory_data': remaining_memory_data})}\n\n"

        yield f"nostream: {json.dumps({'complete_message': complete_message})}"
        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Error when calling agent: {e}")
        yield "data: {'error': 'Error when calling agent:  {e}'}\n\n"
        yield "data: [DONE]\n\n"
