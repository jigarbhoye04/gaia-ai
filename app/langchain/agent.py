import json
from datetime import datetime, timezone

from langchain_core.messages import AIMessageChunk
from langsmith import traceable

from app.config.loggers import llm_logger as logger
from app.langchain.graph_manager import GraphManager
from app.langchain.messages import construct_langchain_messages
from app.models.message_models import MessageRequestWithHistory
from app.services.memory_service import memory_service
from app.models.memory_models import ConversationMemory


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

    # Construct LangChain messages with memory retrieval
    history = await construct_langchain_messages(
        messages,
        files_data=request.fileData,
        currently_uploaded_file_ids=request.fileIds,
        user_id=user_id,
        query=request.message,
    )

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
        if user_id and complete_message and request.message:
            try:
                conversation_memory = ConversationMemory(
                    user_message=request.message,
                    assistant_response=complete_message,
                    conversation_id=conversation_id,
                    user_id=user_id,
                    metadata={
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )

                await memory_service.store_conversation(conversation_memory)
                logger.info(f"Stored conversation in memory for user {user_id}")
            except Exception as e:
                logger.error(f"Error storing conversation memory: {e}")

        yield f"nostream: {json.dumps({'complete_message': complete_message})}"
        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        yield "data: {'error': 'Error fetching messages'}\n\n"
        yield "data: [DONE]\n\n"
