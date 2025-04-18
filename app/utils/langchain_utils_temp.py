from datetime import datetime, timezone
import json
from typing import Annotated, TypedDict

from langchain_core.messages import (
    AIMessage,
    AIMessageChunk,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from app.config.loggers import llm_logger as logger
from app.config.settings import settings
from app.langchain.templates.agent_template import AGENT_PROMPT_TEMPLATE
from app.langchain.tools import calendar, fetch, flowchart, memory, search, weather
from app.utils.sse_utils import format_tool_response

# GROQ_MODEL = "llama-3.3-70b-versatile"
# GROQ_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct"
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
# GROQ_MODEL = "llama-3.1-8b-instant"

tools = [
    fetch.fetch_webpages,
    search.deep_search,
    search.web_search,
    memory.create_memory,
    weather.get_weather,
    calendar.fetch_calendar_list,
    calendar.calendar_event,
    flowchart.create_flowchart,
]

# Creating the chat model and binding the tools
groq_llm = ChatGroq(
    model=GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    temperature=0.6,
    max_tokens=2048,
    streaming=True,
)
groq_llm = groq_llm.bind_tools(
    tools=tools,
)

# Default chat model
# default_llm = DefaultChatAgent(
#     # model="@cf/meta/llama-3.1-8b-instruct-fast",
#     model="@cf/meta/llama-3.3-70b-versatile",
#     temperature=0.6,
#     max_tokens=2048,
# )
# default_llm = default_llm.bind_tools(
#     tools=tools,
# )


# Define the state for the StateGraph
class State(TypedDict):
    messages: Annotated[list, add_messages]
    force_web_search: bool
    force_deep_search: bool
    current_datetime: str  # Store current date and time


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
        logger.error(f"Error in Groq API call: {str(e)}")

        return {
            "messages": [
                AIMessage(
                    content="I'm having trouble processing your request. Please try again with a simpler query."
                )
            ]
        }


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


def process_message_history(messages):
    langchain_messages = []

    # Format current datetime for the template
    current_time = datetime.now(timezone.utc)
    formatted_time = current_time.strftime("%A, %B %d, %Y, %H:%M:%S UTC")

    # Apply the template with the current datetime
    system_prompt = AGENT_PROMPT_TEMPLATE.format(current_datetime=formatted_time)
    langchain_messages.append(SystemMessage(system_prompt))

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
    access_token=None,
):
    """Send a prompt to the LLM API with streaming enabled."""

    message_history = process_message_history(messages)

    # Create initial state with current date and time
    initial_state = {
        "messages": message_history,
        "force_web_search": False,
        "force_deep_search": False,
        "current_datetime": datetime.now(timezone.utc).isoformat(),
    }

    try:
        # Stream events from the graph
        async for event in graph.astream(
            initial_state,
            stream_mode=["messages"],
            config={
                "configurable": {
                    "thread_id": conversation_id,
                    "user_id": user_id,
                    "access_token": access_token if access_token else None,
                },
                "recursion_limit": 10,
                "metadata": {"user_id": user_id},
            },
        ):
            # Unpack the properties from the event
            _, (chunk, metadata) = event

            # If the chunk is a message from the agent
            if isinstance(chunk, AIMessageChunk):
                yield f"data: {json.dumps({'response': chunk.content})}\n\n"

            # If the chunk is output of a tool
            if isinstance(chunk, ToolMessage):
                print(f"{event=}")
                try:
                    yield format_tool_response(
                        tool_name=chunk.name,
                        content=str(chunk.content),
                    )
                except Exception as tool_error:
                    logger.error(f"Error formatting tool response: {tool_error}")
                    yield f"data: {json.dumps({'error': f'Error processing {chunk.name} response'})}\n\n"

        # Signal completion of the stream
        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Graph model error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"
