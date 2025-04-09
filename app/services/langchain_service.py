"""
This file is a temporary service file to make it easy to implement the chat_service functionality with langchain. The file will be merged with chat_service and other files in the future.
This file is not intended to be used in production and is for development purposes only.
"""

import json
from typing import AsyncGenerator

from langgraph.prebuilt import create_react_agent
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, AIMessage

from app.langchain.templates.agent_template import create_agent_prompt
from app.langchain.tools.fetch import fetch_webpages
from app.langchain.tools.search import deep_search, web_search
from app.langchain.tools.weather import get_weather
from app.models.general_models import MessageRequestWithHistory
from app.utils.sse_utils import format_tool_response


async def chat_stream_langchain(
    body: MessageRequestWithHistory,
) -> AsyncGenerator[str, None]:
    """
    Stream chat responses using LangChain and LangGraph with tool selection.

    Args:
        body (MessageRequestWithHistory): The user message, conversation history, and tool selection flags

    Returns:
        AsyncGenerator[str, None]: A stream of SSE-formatted response chunks
    """
    model = init_chat_model("llama-3.1-8b-instant", model_provider="groq")
    prompt = create_agent_prompt()
    available_tools = []
    forced_tool = None

    if body.search_web:
        print("search web is true")
        available_tools.append(web_search)
        forced_tool = "web_search"
    elif body.deep_search:
        available_tools.append(deep_search)
        forced_tool = "deep_search"

    # if body.use_fetch_webpages:
    #     available_tools.append(fetch_webpages)

    if not available_tools:
        print("no avlble tools")
        available_tools = [get_weather, web_search, deep_search, fetch_webpages]

    # Determine which tool to force (if any)
    # elif body.use_fetch_webpages:
    #     forced_tool = "fetch_webpages"
    # elif body.use_weather:
    #     forced_tool = "weather"

    print(forced_tool)
    if forced_tool:
        llm_with_tools = model.bind_tools(
            tools=available_tools, tool_choice=forced_tool
        )
    else:
        llm_with_tools = model.bind_tools(tools=available_tools)

    agent_executor = create_react_agent(
        model=llm_with_tools, tools=available_tools, prompt=prompt
    )
    final_message = ""

    async for event in agent_executor.astream_events(
        {"messages": [HumanMessage(content=body.message)]}, version="v1"
    ):
        event_type = event.get("event")

        if event_type == "on_chat_model_stream":
            chunk = event["data"]["chunk"]

            if isinstance(chunk, AIMessage) or hasattr(chunk, "content"):
                final_message += chunk.content
                yield f"data: {json.dumps({'type': 'token', 'message': chunk.content})}\n\n"

        elif event_type == "on_tool_end":
            yield format_tool_response(event["name"], event["data"]["output"].content)

    yield f"data: {json.dumps({'type': 'final_message', 'message': final_message})}\n\n"
    yield "data: [DONE]\n\n"
