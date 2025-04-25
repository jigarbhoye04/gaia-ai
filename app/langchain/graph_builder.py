from contextlib import asynccontextmanager
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from app.langchain.chatbot import chatbot
from app.langchain.client import tools

from app.config.settings import settings
from app.langchain.state import State
from app.langchain.tool_injectors import (
    inject_deep_search_tool_call,
    inject_web_search_tool_call,
    should_call_tool,
)


@asynccontextmanager
async def build_graph():
    """Construct and compile the state graph."""
    graph_builder = StateGraph(State)
    graph_builder.add_node("chatbot", chatbot)
    graph_builder.add_node("tools", ToolNode(tools=tools))

    # Injector nodes add tool calls to the state messages
    graph_builder.add_node("inject_web_search", inject_web_search_tool_call)
    graph_builder.add_node("inject_deep_search", inject_deep_search_tool_call)

    # Conditional edges from chatbot to injector nodes or end
    graph_builder.add_conditional_edges(
        START,
        should_call_tool,
        {
            # call_1, call_2, and call_chatbot are the return values from should_call_tool
            # "return_value" : "name of node to call"
            "call_1": "inject_web_search",
            "call_2": "inject_deep_search",
            "call_chatbot": "chatbot",
        },
    )

    # After injecting tool call, route to shared tools node to execute
    graph_builder.add_edge("inject_web_search", "tools")
    graph_builder.add_edge("inject_deep_search", "tools")

    graph_builder.add_conditional_edges("chatbot", tools_condition)
    graph_builder.add_edge("tools", "chatbot")
    graph_builder.add_edge("chatbot", END)
    # checkpointer_cm = PostgresSaver.from_conn_string(settings.POSTGRES_URL)
    # checkpointer = checkpointer_cm.__enter__()

    # return graph_builder.compile(checkpointer=checkpointer)
    async with AsyncPostgresSaver.from_conn_string(
        settings.POSTGRES_URL
    ) as checkpointer:
        graph = graph_builder.compile(checkpointer=checkpointer)
        yield graph
