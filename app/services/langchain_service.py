"""

This file is a temporary service file to make it easy to implement the chat_service functionality with langchain. The file will be merged with chat_service and other files in the future.
This file is not intended to be used in production and is for development purposes only.

"""

from langchain_groq import ChatGroq
from app.models.general_models import MessageRequestWithHistory
from langchain.agents import initialize_agent, AgentType
from langchain.agents import load_tools


async def chat_stream_langchain(
    body: MessageRequestWithHistory,
    user: dict,
    user_ip: str,
):
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )

    tools = load_tools(["openweathermap-api"], llm)

    agent_chain = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.OPENAI_FUNCTIONS,
        verbose=True,
    )

    response = agent_chain.run(body.message)
    return response
