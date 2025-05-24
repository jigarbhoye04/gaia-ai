import json
from datetime import datetime, timezone

from langchain_core.messages import AIMessageChunk, SystemMessage
from langsmith import traceable
from langgraph.config import get_stream_writer

from app.config.loggers import llm_logger as logger
from app.langchain.graph_manager import GraphManager
from app.langchain.messages import construct_langchain_messages
from app.models.message_models import MessageRequestWithHistory
from app.memory.service import memory_service
from app.memory.models import ConversationMemory
from app.langchain.client import ALWAYS_AVAILABLE_TOOLS

# Debug log to confirm the always available tools
logger.info(f"Always available tools: {[tool.name for tool in ALWAYS_AVAILABLE_TOOLS]}")


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
    # writer = get_stream_writer()
    complete_message = ""

    history = construct_langchain_messages(
        messages,
        files_data=request.fileData,
        currently_uploaded_file_ids=request.fileIds,
    )

    # # Retrieve memories before processing
    # if user_id:
    #     try:
    #         # Search for relevant memories
    #         memory_results = await memory_service.search_memories(
    #             query=request.message,
    #             user_id=user_id,
    #             limit=5
    #         )

    #         # If we have memories, add them as a system message
    #         if memory_results.memories:
    #             memory_content = "Based on our previous conversations:\n"
    #             for mem in memory_results.memories:
    #                 memory_content += f"- {mem.content}\n"

    #             # Insert memory context before the last user message
    #             memory_message = SystemMessage(content=memory_content.strip())
    #             if len(history) > 0:
    #                 history.insert(-1, memory_message)

    #             writer({"memory": f"Fetched {len(history)} memories..."})
    #             logger.info(f"Added {len(memory_results.memories)} memories to context")
    #     except Exception as e:
    #         logger.error(f"Error retrieving memories: {e}")

    initial_state = {
        "query": request.message,
        "messages": history,
        "force_web_search": request.search_web,
        "force_deep_search": request.deep_search,
        "current_datetime": datetime.now(timezone.utc).isoformat(),
        "mem0_user_id": user_id,
        "conversation_id": conversation_id,
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
                    "email": user.get("email"),
                },
                "recursion_limit": 7,
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

        # Store the conversation in memory after completion
        # if user_id and complete_message and request.message:
        #     try:
        #         conversation_memory = ConversationMemory(
        #             user_message=request.message,
        #             assistant_response=complete_message,
        #             conversation_id=conversation_id,
        #             user_id=user_id,
        #             metadata={
        #                 "timestamp": datetime.now(timezone.utc).isoformat(),
        #             }
        #         )

        #         await memory_service.store_conversation(conversation_memory)
        #         logger.info(f"Stored conversation in memory for user {user_id}")
        #     except Exception as e:
        #         logger.error(f"Error storing conversation memory: {e}")

        yield f"nostream: {json.dumps({'complete_message': complete_message})}"
        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        yield "data: {'error': 'Error fetching messages'}\n\n"
        yield "data: [DONE]\n\n"
