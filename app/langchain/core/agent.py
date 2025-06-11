import asyncio
import json
from datetime import datetime, timezone

from app.config.loggers import llm_logger as logger
from app.langchain.core.graph_manager import GraphManager
from app.langchain.core.messages import construct_langchain_messages
from app.langchain.prompts.mail_agent_prompt import (
    EMAIL_AGENT_SYSTEM_PROMPT,
    MESSAGE_PROMPT,
)
from app.models.memory_models import ConversationMemory
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


@traceable
async def call_mail_processing_agent(
    email_content: str,
    user_id: str,
    email_metadata: dict | None = None,
    access_token: str | None = None,
    refresh_token: str | None = None,
):
    """
    Process incoming email with AI agent to take appropriate actions.

    Args:
        email_content: The email content to process
        user_id: User ID for context
        email_metadata: Additional email metadata (sender, subject, etc.)
        access_token: User's access token for API calls
        refresh_token: User's refresh token

    Returns:
        dict: Processing results with actions taken
    """
    logger.info(
        f"Starting email processing for user {user_id} with email content length: {len(email_content)}"
    )

    email_metadata = email_metadata or {}

    # Construct the message with system prompt and email content
    messages = [
        {"role": "system", "content": EMAIL_AGENT_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": MESSAGE_PROMPT.format(
                email_content=email_content,
                subject=email_metadata.get("subject", "No Subject"),
                sender=email_metadata.get("sender", "Unknown Sender"),
                date=email_metadata.get("date", "Unknown Date"),
            ),
        },
    ]

    logger.info(
        f"Processing email for user {user_id} with subject: {email_metadata.get('subject', 'No Subject')}"
    )

    # Generate a unique processing ID for this email
    processing_id = f"email_processing_{user_id}_{int(datetime.now().timestamp())}"

    initial_state = {
        "messages": messages,
        "current_datetime": datetime.now(timezone.utc).isoformat(),
        "mem0_user_id": user_id,
        "email_metadata": email_metadata,
        "processing_id": processing_id,
    }

    actions_taken = []
    processing_errors = []

    try:
        # Get the email processing graph
        graph = await GraphManager.get_graph("mail_processing")

        if not graph:
            logger.error(f"No graph found for email processing for user {user_id}")
            raise ValueError(f"Graph not found for email processing: {user_id}")

        logger.info(
            f"Graph for email processing retrieved successfully for user {user_id}"
        )

        # Just invoke the graph directly - no streaming needed
        result = await graph.ainvoke(
            initial_state,
            config={
                "configurable": {
                    "thread_id": processing_id,
                    "user_id": user_id,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "initiator": "backend",  # This will be used to identify either to send notification or stream to the user
                },
                "recursion_limit": 5,  # Lower limit for email processing
                "metadata": {
                    "user_id": user_id,
                    "processing_type": "email",
                    "email_subject": email_metadata.get("subject", ""),
                },
            },
        )

        logger.info(
            f"Email processing result for user {user_id}: {result}"
            if result
            else "No result returned"
        )

        # Extract actions taken from the result
        if result and "messages" in result:
            for message in result["messages"]:
                if hasattr(message, "tool_calls") and message.tool_calls:
                    for tool_call in message.tool_calls:
                        actions_taken.append(
                            {
                                "tool": tool_call.get("name", "unknown"),
                                "args": tool_call.get("args", {}),
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                            }
                        )
                        logger.info(
                            f"Email processing tool called: {tool_call.get('name')}"
                        )

        # Prepare results
        processing_results = {
            "success": True,
            "processing_id": processing_id,
            "user_id": user_id,
            "email_metadata": email_metadata,
            "actions_taken": actions_taken,
            "actions_count": len(actions_taken),
            "errors": processing_errors,
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(
            f"Email processing completed for user {user_id}. Actions taken: {len(actions_taken)}"
        )

        return processing_results
    except Exception as e:
        logger.error(f"Error in email processing for user {user_id}: {str(e)}")

        return {
            "success": False,
            "processing_id": processing_id,
            "user_id": user_id,
            "email_metadata": email_metadata,
            "actions_taken": actions_taken,
            "actions_count": len(actions_taken),
            "errors": processing_errors
            + [{"error": str(e), "timestamp": datetime.now(timezone.utc).isoformat()}],
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }
