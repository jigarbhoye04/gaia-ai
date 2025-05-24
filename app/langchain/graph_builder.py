from contextlib import asynccontextmanager

from langchain_huggingface import HuggingFaceEmbeddings
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.graph import START
from langgraph.store.memory import InMemoryStore
from langgraph_bigtool import create_agent

from app.langchain.client import init_groq_client
from app.config.settings import settings
from app.langchain.client import tools
from app.langchain.tool_injectors import (
    inject_deep_search_tool_call,
    inject_web_search_tool_call,
    should_call_tool,
)
from app.langchain.utils.tool_retrieval import retrieve_tools

llm = init_groq_client()


@asynccontextmanager
async def build_graph():
    """Construct and compile the state graph."""
    # Register both regular and always available tools
    from app.langchain.client import ALWAYS_AVAILABLE_TOOLS
    all_tools = tools + ALWAYS_AVAILABLE_TOOLS
    tool_registry = {tool.name: tool for tool in all_tools}

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # Create store for tool discovery
    store = InMemoryStore(
        index={
            "embed": embeddings,
            "dims": 384,
            "fields": ["description"],
        }
    )

    # Store ONLY regular tools for vector search (NOT always available tools)
    for tool in tools:
        store.put(
            ("tools",),
            tool.name,
            {
                "description": f"{tool.name}: {tool.description}",
            },
        )

    # Create agent with custom tool retrieval logic
    builder = create_agent(llm, tool_registry, retrieve_tools_function=retrieve_tools)

    # Injector nodes add tool calls to the state messages
    builder.add_node("inject_web_search", inject_web_search_tool_call)
    builder.add_node("inject_deep_search", inject_deep_search_tool_call)

    # Conditional edges from chatbot to injector nodes or end
    builder.add_conditional_edges(
        START,
        should_call_tool,
        {
            # call_1, call_2, and call_chatbot are the return values from should_call_tool
            # "return_value" : "name of node to call"
            "call_1": "inject_web_search",
            "call_2": "inject_deep_search",
            "call_chatbot": "agent",
        },
    )

    # After injecting tool call, route to shared tools node to execute
    builder.add_edge("inject_web_search", "tools")
    builder.add_edge("inject_deep_search", "tools")

    async with AsyncPostgresSaver.from_conn_string(
        settings.POSTGRES_URL
    ) as checkpointer:
        await checkpointer.setup()
        graph = builder.compile(checkpointer=checkpointer, store=store)
        print(graph.get_graph().draw_mermaid())
        yield graph
