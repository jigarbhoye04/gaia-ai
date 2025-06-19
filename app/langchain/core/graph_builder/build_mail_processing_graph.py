from contextlib import asynccontextmanager

from langchain_core.messages import AIMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode

from app.langchain.llm.client import init_llm
from app.langchain.tools.calendar_tool import create_calendar_event
from app.langchain.tools.mail_tool import compose_email
from app.langchain.tools.memory_tools import add_memory

llm = init_llm()


mail_processing_tools = [
    compose_email,
    create_calendar_event,
    add_memory,
]
mail_processing_llm = llm.bind_tools(tools=mail_processing_tools)


# Define the LLM agent node
def call_model(state: MessagesState):
    messages = state["messages"]
    response = mail_processing_llm.invoke(messages)
    return {"messages": [response]}


@asynccontextmanager
async def build_mail_processing_graph():
    """
    Build a minimal processing graph for handling user emails with LLM assistance.

    This graph is designed for scenarios where the LLM processes incoming user emails
    and may take a limited set of predefined actions such as:
    - Creating a draft reply
    - Adding a calendar event
    - Creating a memory
    - Creating a task or reminder

    Since this flow involves only a few known tools and does not require dynamic
    discovery or retrieval, we use a simple, fixed state graph with minimal overhead.
    """

    # Create a simple state graph
    workflow = StateGraph(MessagesState)

    # Add the LLM agent node
    workflow.add_node("agent", call_model)

    # Add the tools node with fixed set of tools
    workflow.add_node(
        "tools",
        ToolNode(
            tools=mail_processing_tools,
        ),
    )

    # Determine whether to route to tools or end the workflow
    def should_continue(state: MessagesState):
        messages = state["messages"]
        last_message = messages[-1]

        # Route to tools if the LLM made a tool call
        if isinstance(last_message, AIMessage) and last_message.tool_calls:
            return "tools"
        return "__end__"

    # Define graph edges
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        path_map={
            "tools": "tools",
            "__end__": "__end__",
        },
    )
    workflow.add_edge("tools", "agent")

    # Use an in-memory checkpointer for simplicity
    # In production, you might want to use AsyncPostgresSaver or another persistent storage
    # We are getting connection closed errors with AsyncPostgresSaver in worker processes,
    # so we use InMemorySaver for now.
    # TODO: Investigate AsyncPostgresSaver connection issues in worker processes.
    checkpointer = InMemorySaver()

    # Compile and yield the final graph
    graph = workflow.compile(checkpointer=checkpointer)

    print("Email Processing Graph:")
    print(graph.get_graph().draw_mermaid())

    yield graph
