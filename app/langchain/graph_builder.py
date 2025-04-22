from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from app.langchain.chatbot import chatbot
from app.langchain.client import tools
from app.langchain.state import State
from app.config.loggers import llm_logger as logger
# from app.langchain.tools import search_tool

# web_search_tool = ToolNode([search_tool.web_search_tool], name="web_search_tool")


# def should_call_tool(state: State):
#     logger.info(f"force web search in state is: {state.get('force_web_search')}")
#     logger.info(f"current_datetime in state is: {state.get('current_datetime')}")

#     if state.get("force_web_search", False):
#         return "web_search_tool"
#     # elif state.get("force_deep_search", False):
#     #     return "call_2"
#     else:
#         return END


def build_graph():
    """Construct and compile the state graph."""
    graph_builder = StateGraph(State)
    graph_builder.add_node("chatbot", chatbot)
    graph_builder.add_node("tools", ToolNode(tools=tools))
    # graph_builder.add_node("web_search_tool", web_search_tool)

    graph_builder.add_edge(START, "chatbot")
    # graph_builder.add_conditional_edges(
    #     "chatbot",
    #     should_call_tool,
    #     {
    #         "call_1": "web_search_tool",
    #         END: END,
    #     },
    # )
    # graph_builder.add_conditional_edges("chatbot", should_call_tool)
    # graph_builder.add_edge("web_search_tool", "chatbot")
    graph_builder.add_conditional_edges("chatbot", tools_condition)
    graph_builder.add_edge("tools", "chatbot")
    graph_builder.add_edge("chatbot", END)

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
