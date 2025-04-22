from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode

from app.config.loggers import llm_logger as logger
from app.langchain.chatbot import chatbot
from app.langchain.client import tools
from app.langchain.state import State


def build_graph():
    """Construct and compile the state graph."""
    graph_builder = StateGraph(State)

    # Add nodes
    graph_builder.add_node("chatbot", chatbot)
    graph_builder.add_node("tools", ToolNode(tools=tools))

    # Define edges
    graph_builder.add_edge(START, "chatbot")

    #
    # After tools node, return to chatbot
    graph_builder.add_edge("tools", "chatbot")

    # Allow chatbot to end the graph
    graph_builder.add_edge("chatbot", END)

    # Add tool condition edges
    # graph_builder.add_conditional_edges("chatbot", tools_condition)

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
