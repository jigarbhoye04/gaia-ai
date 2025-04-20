from datetime import datetime, timezone
from typing import List, TypeAlias, Union

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.langchain.templates.agent_template import AGENT_PROMPT_TEMPLATE
from app.models.general_models import MessageDict
from app.services.file_service import fetch_files

LangChainMessageType: TypeAlias = Union[SystemMessage, HumanMessage, AIMessage]


def construct_langchain_messages(
    messages: List[MessageDict],
) -> List[LangChainMessageType]:
    """Convert raw dict messages to LangChain message objects with current datetime."""
    formatted_time = datetime.now(timezone.utc).strftime("%A, %B %d, %Y, %H:%M:%S UTC")

    system_prompt = AGENT_PROMPT_TEMPLATE.format(current_datetime=formatted_time)
    chain_msgs: List[LangChainMessageType] = [SystemMessage(system_prompt)]

    for msg in messages:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            chain_msgs.append(HumanMessage(content=content))
        elif role in ("assistant", "bot"):
            chain_msgs.append(AIMessage(content=content))
    return chain_msgs


async def add_file_content_to_message(
    message: MessageDict, file_ids: List[str] | None, user_id: str
) -> MessageDict:
    """Fetch files and update the last message in the context."""
    if not (file_ids or user_id):
        # If no file IDs or user ID, return the original message
        return message

    # Fetch files and update the last message in the context
    context = await fetch_files(
        context={
            "user_id": user_id,
            "last_message": message,
            "fileIds": file_ids,
        }
    )

    return context["last_message"] if context else message
