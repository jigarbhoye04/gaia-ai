from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage

from app.langchain.prompts.agent_prompt import AGENT_SYSTEM_PROMPT


def create_agent_prompt():
    return ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=AGENT_SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )
