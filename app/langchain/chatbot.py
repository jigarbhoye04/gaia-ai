from langchain_core.messages import AIMessage

from app.config.loggers import chat_logger as logger
from app.langchain.client import init_groq_client
from app.langchain.state import State

llm_with_tools, llm_without_tools, tools = init_groq_client()


async def chatbot(
    state: State,
    use_tools: bool = True,
):
    """Chatbot function that uses the state graph and model."""
    try:
        # Call the Groq API with the provided messages
        if use_tools:
            response = await llm_with_tools.ainvoke(state["messages"])
        else:
            response = await llm_without_tools.ainvoke(state["messages"])

        return {"messages": [response]}
    except Exception as e:
        logger.error(f"Error in Groq API call: {str(e)}")

        return {
            "messages": [
                AIMessage(
                    content="I'm having trouble processing your request. Please try again later."
                )
            ]
        }
