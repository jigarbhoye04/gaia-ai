import json
from typing import Annotated, Dict, List, Optional, TypedDict

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
from app.prompts.system.general import MAIN_SYSTEM_PROMPT
from app.utils.sse_utils import format_tool_response


# Default model to use with Groq
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


def prepare_messages(
    messages: List[Dict], system_prompt: Optional[str] = None
) -> List[Dict]:
    """Prepare messages for LLM API calls by standardizing roles and adding system prompt."""
    prepared_messages = messages.copy()

    # Convert 'bot' role to 'assistant' role
    for msg in prepared_messages:
        if msg.get("role") == "bot":
            msg["role"] = "assistant"

    # Add system prompt if it doesn't exist
    if system_prompt and not any(
        msg.get("role") == "system" for msg in prepared_messages
    ):
        prepared_messages.insert(0, {"role": "system", "content": system_prompt})

    return prepared_messages


few_shot_tool_calling_examples = [
    HumanMessage(content="What is the weather in New York?"),
    AIMessage(
        content="",
        tool_calls=[
            {
                "name": "get_weather",
                "args": {
                    "location": "New York",
                },
                "id": "1",
            }
        ],
    ),
    HumanMessage(content="Can you fetch the latest news articles about AI?"),
    AIMessage(
        content="",
        tool_calls=[
            {
                "name": "web_search",
                "args": {
                    "query_text": "latest news about AI",
                },
                "id": "2",
            }
        ],
    ),
    HumanMessage(
        content="Hey, I am a computer science student currently studying computer science degree."
    ),
    AIMessage(
        content="",
        tool_calls=[
            {
                "name": "create_memory",
                "args": {
                    "plaintext": "I am a student pursuing a degree in Computer Science.",
                    "content": "# I am a student pursuing a degree in Computer Science.",
                },
                "id": "3",
            }
        ],
    ),
]


async def process_tool_output(): ...
async def process_agent_output(): ...


async def do_prompt_with_stream(
    messages: list,
    query_text: str,
    conversation_id,
    user_id,
    system_prompt: str = MAIN_SYSTEM_PROMPT,
):
    """Send a prompt to the LLM API with streaming enabled. Tries Groq first, falls back to original LLM."""
    # processed_messages = prepare_messages(messages, system_prompt)
    # user_message = await extract_last_user_message(messages)
    # bot_message = ""

    # Trying the graph model first
    try:
        async for event in graph.astream(
            {
                "messages": [
                    SystemMessage("You are a helpful assistant."),
                    *few_shot_tool_calling_examples,
                    HumanMessage(query_text),
                ],
            },
            config={
                "configurable": {"thread_id": conversation_id, "user_id": user_id},
                "recursion_limit": 10,
            },
        ):
            print(f"{event=}")
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

    # try:
    #     async for data in call_groq_api_stream(
    #         processed_messages, temperature, max_tokens
    #     ):
    #         content = data.get("response", "")
    #         if content:
    #             bot_message += content
    #             yield f"data: {json.dumps(data)}\n\n"

    #     if context.get("search_results", None):
    #         yield f"data: {json.dumps({'search_results': context['search_results']})}\n\n"

    #     elif context.get("deep_search_results", None):
    #         yield f"data: {json.dumps({'deep_search_results': context['deep_search_results']})}\n\n"

    #     elif context.get("weather_data", None):
    #         yield f"data: {json.dumps({'intent': 'weather', 'weather_data': context['weather_data']})}\n\n"

    #     elif intent == "calendar":
    #         success, options = await process_calendar_event(
    #             user_message,
    #             bot_message,
    #             context.get("user_id"),
    #             context.get("access_token"),
    #         )
    #         if success:
    #             yield f"data: {json.dumps({'intent': 'calendar', 'calendar_options': options})}\n\n"

    #     yield "data: [DONE]\n\n"
    #     return

    # except Exception as e:
    #     logger.warning(f"Groq API error, falling back to default LLM: {e}")

    # # Fall back to original LLM - use the same message format as Groq for consistency
    # json_data = {
    #     "stream": "true",
    #     "max_tokens": max_tokens,
    #     "temperature": temperature,
    #     "messages": processed_messages,
    #     "model": model,
    # }

    # async with http_async_client.stream(
    #     "POST",
    #     settings.LLM_URL,
    #     json=json_data,
    # ) as response:
    #     response.raise_for_status()
    #     async for line in process_streaming(
    #         response=response,
    #         user_message=user_message,
    #         context=context,
    #         intent=intent,
    #     ):
    #         yield line
