from langchain_core.messages import AIMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from app.langchain.chatbot import chatbot
from app.langchain.state import State
from app.config.loggers import llm_logger as logger
from app.langchain.client import tools


def inject_web_search_tool_call(state: State):
    logger.info("Injecting web_search_tool call into messages")

    tool_call = {
        "name": "web_search_tool",  # Must match the tool's registered name
        "args": {"query_text": state.get("query", "")},  # Example argument
        "id": "forced_web_search_call",
        "type": "tool_call",
    }
    ai_message = AIMessage(content="", tool_calls=[tool_call])
    messages = state.get("messages", [])
    messages.append(ai_message)
    return {"messages": messages}


def inject_deep_search_tool_call(state: State):
    logger.info("Injecting deep_search_tool call into messages")

    tool_call = {
        "name": "deep_search_tool",
        "args": {"query_text": state.get("query", "")},
        "id": "forced_deep_search_call",
        "type": "tool_call",
    }
    ai_message = AIMessage(content="", tool_calls=[tool_call])
    messages = state.get("messages", [])
    messages.append(ai_message)
    return {"messages": messages}


def should_call_tool(state: State):
    logger.info(f"force web search in state is: {state.get('force_web_search')}")
    logger.info(f"force deep search in state is: {state.get('force_deep_search')}")

    if state.get("force_web_search", False):
        return "inject_web_search"
    elif state.get("force_deep_search", False):
        return "inject_deep_search"
    else:
        return END


def build_graph():
    """Construct and compile the state graph."""

    graph_builder = StateGraph(State)

    graph_builder.add_node("chatbot", chatbot)
    graph_builder.add_node("tools", ToolNode(tools=tools))

    # Injector nodes add tool calls to the state messages
    graph_builder.add_node("inject_web_search", inject_web_search_tool_call)
    graph_builder.add_node("inject_deep_search", inject_deep_search_tool_call)

    graph_builder.set_entry_point("chatbot")

    # Conditional edges from chatbot to injector nodes or end
    graph_builder.add_conditional_edges(
        "chatbot",
        should_call_tool,
        {
            "inject_web_search": "inject_web_search",
            "inject_deep_search": "inject_deep_search",
            END: END,
        },
    )

    # After injecting tool call, route to shared tools node to execute
    graph_builder.add_edge("inject_web_search", "tools")
    graph_builder.add_edge("inject_deep_search", "tools")

    # Normal tool calling loop: chatbot -> tools -> chatbot or end
    graph_builder.add_conditional_edges("chatbot", tools_condition)
    graph_builder.add_edge("tools", "chatbot")
    graph_builder.add_edge("chatbot", END)

    # Add memory saver to prevent infinite loops
    memory_saver = InMemorySaver()

    try:
        return graph_builder.compile(checkpointer=memory_saver)
    except Exception as e:
        logger.error(f"Error compiling graph: {e}")
        return graph_builder.compile(checkpointer=memory_saver)
