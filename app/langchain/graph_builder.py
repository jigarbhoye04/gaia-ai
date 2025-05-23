import uuid
from contextlib import asynccontextmanager

from langchain_huggingface import HuggingFaceEmbeddings
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.graph import END, START
from langgraph.store.memory import InMemoryStore
from langgraph_bigtool import create_agent

from app.config.settings import settings
from app.langchain.client import init_groq_client
from app.langchain.client import tools as all_tools
from app.langchain.tool_injectors import (
    inject_deep_search_tool_call,
    inject_web_search_tool_call,
    should_call_tool,
)

llm = init_groq_client()


@asynccontextmanager
async def build_graph():
    """Construct and compile the state graph."""
    tool_registry = {str(uuid.uuid4()): tool for tool in all_tools}

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    store = InMemoryStore(
        index={
            "embed": embeddings,
            "dims": 384,
            "fields": ["description"],
        }
    )

    for tool_id, tool in tool_registry.items():
        # logger.info(f"Registering tool: {tool.name=} ({tool_id=}) {tool.description=}")
        store.put(
            ("tools",),
            tool_id,
            {
                "description": f"{tool.name}: {tool.description}",
            },
        )

    builder = create_agent(llm, tool_registry)

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

    builder.add_edge("agent", END)

    async with AsyncPostgresSaver.from_conn_string(
        settings.POSTGRES_URL
    ) as checkpointer:
        await checkpointer.setup()
        graph = builder.compile(checkpointer=checkpointer, store=store)
        print(graph.get_graph().draw_mermaid())
        yield graph
