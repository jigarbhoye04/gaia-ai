from datetime import datetime, timezone
from typing import List, TypeAlias, Union
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.langchain.templates.agent_template import AGENT_PROMPT_TEMPLATE

LangChainMessageType: TypeAlias = Union[SystemMessage, HumanMessage, AIMessage]


def construct_langchain_messages(messages):
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
