import json
from datetime import datetime, timezone

from langchain_core.messages import AIMessageChunk
from langsmith import traceable

from app.config.loggers import llm_logger as logger
from app.langchain.core.graph_manager import GraphManager
from app.langchain.core.messages import construct_langchain_messages
from app.models.message_models import MessageRequestWithHistory
from app.services.memory_service import memory_service
from app.models.memory_models import ConversationMemory


async def store_conversation_memory(
    user_id, user_message, assistant_response, conversation_id
):
    """
    Store a conversation memory with user message and assistant response.

    Args:
        user_id: The user's ID
        user_message: The user's message
        assistant_response: The assistant's response
        conversation_id: The conversation ID

    Returns:
        tuple: (success_flag, memory_data_event)
    """
    # Skip if any required parameter is missing
    if (
        not user_id
        or not user_message
        or not user_message.strip()
        or not assistant_response
        or not assistant_response.strip()
    ):
        logger.info("Skipping memory storage - missing required parameters")
        return False, None

    try:
        # Create conversation memory
        conversation_memory = ConversationMemory(
            user_message=user_message,
            assistant_response=assistant_response,
            conversation_id=conversation_id,
            user_id=user_id,
            metadata={
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

        result = await memory_service.store_conversation(conversation_memory)

        if result:
            logger.info("Conversation memory stored successfully")
            memory_data = {
                "type": "memory_stored",
                "content": f"Stored conversation: {user_message[:50]}...",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "conversation_id": conversation_id,
            }
            return True, memory_data
        else:
            logger.info("Memory service declined to store memory")
            return False, None

    except Exception as e:
        logger.error(f"Error storing conversation memory: {e}")
        return False, None


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
        user_name=user.get("name"),
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

        # Update the conversation in memory with complete response
        if user_id and complete_message and request.message:
            success, memory_data = await store_conversation_memory(
                user_id, request.message, complete_message, conversation_id
            )

            if success and memory_data:
                yield f"data: {json.dumps({'memory_data': memory_data})}\n\n"

        yield f"nostream: {json.dumps({'complete_message': complete_message})}"
        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Error when calling agent: {e}")
        yield "data: {'error': 'Error when calling agent:  {e}'}\n\n"
        yield "data: [DONE]\n\n"
