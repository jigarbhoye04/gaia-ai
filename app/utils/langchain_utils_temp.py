import json
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, ToolMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from app.config.loggers import llm_logger as logger
from app.config.settings import settings
from app.langchain.chat_models.default_chat_model import DefaultChatAgent
from app.langchain.tools import fetch, memory, search, weather
from app.utils.sse_utils import format_tool_response
from app.langchain.prompts.agent_prompt import AGENT_SYSTEM_PROMPT
from app.langchain.templates.agent_template import create_agent_prompt

# GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_MODEL = "llama-3.1-8b-instant"

tools = [
    fetch.fetch_webpages,
    search.deep_search,
    search.web_search,
    memory.create_memory,
    weather.get_weather,
]

# Creating the chat model and binding the tools
groq_llm = ChatGroq(
    model=GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    temperature=0.6,
    max_tokens=2048,
)
groq_llm = groq_llm.bind_tools(
    tools=tools,
)

# Default chat model
default_llm = DefaultChatAgent(
    # model="@cf/meta/llama-3.1-8b-instruct-fast",
    model="@cf/meta/llama-3.3-70b-versatile",
    temperature=0.6,
    max_tokens=2048,
)
default_llm = default_llm.bind_tools(
    tools=tools,
)


# Define the state for the StateGraph
class State(TypedDict):
    messages: Annotated[list, add_messages]
    force_web_search: bool
    force_deep_search: bool


# Create the state graph builder
graph_builder = StateGraph(State)


async def chatbot(
    state: State,
):
    """Chatbot function that uses the state graph and model."""
    try:
        # Try to call the Groq API with the provided messages
        response = await groq_llm.ainvoke(state["messages"])
        return {"messages": [response]}
    except Exception as e:
        logger.error(f"Error in Groq API call: {e}")
        logger.info(f"Falling back to default LLM: {e}")

    try:
        response = await default_llm.ainvoke(state["messages"])
        return {"messages": [response]}
    except Exception as e:
        logger.error(f"Error in default LLM call: {e}")
        raise e


graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("tools", ToolNode(tools=tools))

graph_builder.add_edge(START, "chatbot")
graph_builder.add_edge("chatbot", END)
graph_builder.add_edge("tools", "chatbot")

graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition,
)

# TODO: Use sqlite to store the state graph instead of in-memory
graph = graph_builder.compile(checkpointer=MemorySaver())


# Create the agent prompt template that instructs the model how to use tools
agent_prompt_template = create_agent_prompt()


def process_message_history(messages):
    langchain_messages = []

    langchain_messages.append(SystemMessage(AGENT_SYSTEM_PROMPT))

    for msg in messages:
        if msg.get("role") == "user":
            langchain_messages.append(HumanMessage(content=msg.get("content", "")))
        elif msg.get("role") in ["assistant", "bot"]:
            langchain_messages.append(AIMessage(content=msg.get("content", "")))

    return langchain_messages


async def do_prompt_with_stream(
    messages: list,
    conversation_id,
    user_id,
):
    """Send a prompt to the LLM API with streaming enabled."""

    message_history = process_message_history(messages)

    try:
        async for event in graph.astream(
            {"messages": message_history},
            config={
                "configurable": {"thread_id": conversation_id, "user_id": user_id},
                "recursion_limit": 10,
                "metadata": {"user_id": user_id},
            },
        ):
            for value in event.values():
                print(f"{value=}")
                last_msg = value["messages"][-1]

                if isinstance(last_msg, ToolMessage):
                    yield format_tool_response(
                        tool_name=last_msg.name, content=str(last_msg.content)
                    )
                    continue

                if isinstance(last_msg, AIMessage):
                    yield f"data: {json.dumps({'response': last_msg.content})}\n\n"

        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.warning(f"Graph model error: {e}")
