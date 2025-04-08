"""

This file is a temporary service file to make it easy to implement the chat_service functionality with langchain. The file will be merged with chat_service and other files in the future.
This file is not intended to be used in production and is for development purposes only.

"""

import json
from typing import AsyncGenerator

from langgraph.prebuilt import create_react_agent
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, AIMessage

from app.langchain.tools.weather import get_weather
from app.models.general_models import MessageRequestWithHistory


async def chat_stream_langchain(
    body: MessageRequestWithHistory,
) -> AsyncGenerator[str, None]:
    model = init_chat_model("llama-3.1-8b-instant", model_provider="groq")
    tools = [get_weather]  # append more tools as needed
    agent_executor = create_react_agent(model, tools=tools)  # create lang graph agent

    final_message = ""

    async for event in agent_executor.astream_events(
        {"messages": [HumanMessage(content=body.message)]}, version="v1"
    ):
        event_type = event.get("event")

        # Possible event types:
        # on_chat_model_stream | on_tool_start | on_tool_end | on_chain_end | on_chat_model_stream
        if event_type == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            if isinstance(chunk, AIMessage) or hasattr(chunk, "content"):
                final_message += chunk.content
                yield f"data: {json.dumps({'type': 'token', 'message': chunk.content})}\n\n"

    yield f"data: {json.dumps({'type': 'final_message', 'message': final_message})}\n\n"
    yield "data: [DONE]\n\n"
