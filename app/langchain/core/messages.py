from datetime import datetime, timezone
from typing import List, Optional

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage

from app.config.loggers import llm_logger as logger
from app.langchain.templates.agent_template import AGENT_PROMPT_TEMPLATE
from app.services.memory_service import MemorySearchResult, memory_service
from app.models.message_models import FileData, MessageDict


async def construct_langchain_messages(
    messages: List[MessageDict],
    files_data: List[FileData] | None = None,
    currently_uploaded_file_ids: Optional[List[str]] = [],
    user_id: Optional[str] = None,
    query: Optional[str] = None,
) -> List[AnyMessage]:
    """
    Convert raw dict messages to LangChain message objects with current datetime.

    Args:
        messages: List of message dictionaries containing role and content
        files_data: Optional list of file data objects
        currently_uploaded_file_ids: Optional list of currently uploaded file IDs
        user_id: Optional user ID for retrieving relevant memories
        query: Optional query string for memory search (usually the latest user message)

    Returns:
        List of LangChain message objects
    """
    # Format current time for the system prompt
    formatted_time = datetime.now(timezone.utc).strftime("%A, %B %d, %Y, %H:%M:%S UTC")

    # Format the list of files if any
    current_files_str = _format_files_list(files_data, currently_uploaded_file_ids)

    # Create the system prompt with the current time
    system_prompt = AGENT_PROMPT_TEMPLATE.format(current_datetime=formatted_time)

    chain_msgs: List[AnyMessage] = [SystemMessage(content=system_prompt)]

    # Add relevant memories from memory service if user_id and query are provided
    if user_id and query:
        try:
            # Search for relevant memories
            memory_results: MemorySearchResult = await memory_service.search_memories(
                query=query, user_id=user_id, limit=5
            )

            # If we have memories, add them as a system message
            if (
                memory_results
                and hasattr(memory_results, "memories")
                and memory_results.memories
            ):
                memory_content = "Based on our previous conversations:\n"
                for mem in memory_results.memories:
                    memory_content += f"- {mem.content}\n"

                # Add memory as a system message
                memory_message = SystemMessage(content=memory_content.strip())
                chain_msgs.append(memory_message)

                logger.info(f"Added {len(memory_results.memories)} memories to context")
        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")

    # Convert each message to the appropriate LangChain message type
    for index, msg in enumerate(messages):
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            # If the message is last and the role is "user", it means the user is uploading files
            if index == len(messages) - 1 and currently_uploaded_file_ids:
                content += f"\n\n{current_files_str}"
            chain_msgs.append(HumanMessage(content=content))
        elif role in ("assistant", "bot"):
            chain_msgs.append(AIMessage(content=content))

    return chain_msgs


def _format_files_list(
    files_data: Optional[List[FileData]], file_ids: Optional[List[str]] = None
) -> str:
    """Format list of files into a readable string.

    Args:
        files_data: List of FileData objects containing file information.
        file_ids: Optional list of file IDs to filter the files. If None, all files are included.
        If empty, returns "No files uploaded."
    Returns:
        str: Formatted string of file names and IDs.
    """
    if not files_data:
        return "No files uploaded."

    if file_ids is None:
        return "\n".join(
            f"- Name: {file.filename} Id: {file.fileId}" for file in files_data
        )

    if not file_ids:
        return "No files uploaded."

    # Filter files based on file_ids
    files_data = list(filter(lambda x: x.fileId in file_ids, files_data))
    if not files_data:
        return "No files uploaded."

    return "\n".join(
        f"- Name: {file.filename} Id: {file.fileId}" for file in files_data
    )
