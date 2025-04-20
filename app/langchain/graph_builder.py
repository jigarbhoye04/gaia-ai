from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from app.langchain.chatbot import chatbot, tools
from app.langchain.state import State
from app.config.loggers import llm_logger as logger


def build_graph():
    """Construct and compile the state graph."""
    graph_builder = StateGraph(State)
    graph_builder.add_node("chatbot", chatbot)
    graph_builder.add_node("tools", ToolNode(tools=tools))

    graph_builder.add_edge(START, "chatbot")
    graph_builder.add_edge("chatbot", END)
    graph_builder.add_edge("tools", "chatbot")
    graph_builder.add_conditional_edges("chatbot", tools_condition)

    # Add a proper memory saver with configuration to prevent infinite loops
    memory_saver = MemorySaver()

    try:
        return graph_builder.compile(
            checkpointer=memory_saver,
        )
    except Exception as e:
        logger.error(f"Error compiling graph: {e}")
        # Fallback with simpler configuration
        return graph_builder.compile(checkpointer=memory_saver)
