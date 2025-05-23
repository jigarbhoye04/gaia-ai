from datetime import datetime, timezone
from typing import List, Optional

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage

from app.langchain.templates.agent_template import AGENT_PROMPT_TEMPLATE
from app.models.message_models import FileData, MessageDict


def construct_langchain_messages(
    messages: List[MessageDict],
    files_data: List[FileData] | None = None,
    currently_uploaded_file_ids: Optional[List[str]] = [],
) -> List[AnyMessage]:
    """Convert raw dict messages to LangChain message objects with current datetime."""
    formatted_time = datetime.now(timezone.utc).strftime("%A, %B %d, %Y, %H:%M:%S UTC")

    current_files_str = _format_files_list(files_data, currently_uploaded_file_ids)

    system_prompt = AGENT_PROMPT_TEMPLATE.format(current_datetime=formatted_time)
    chain_msgs: List[AnyMessage] = [SystemMessage(system_prompt)]

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
