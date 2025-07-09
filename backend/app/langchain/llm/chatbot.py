from langchain_core.messages import AIMessage

from app.config.loggers import chat_logger as logger
from app.langchain.core.state import State
from app.langchain.llm.client import init_llm

llm = init_llm()


async def chatbot(
    state: State,
):
    """Chatbot function that uses the state graph and model."""
    try:
        response = await llm.ainvoke(state.messages)

        return {"messages": [response]}
    except Exception as e:
        logger.error(f"Error in LLM API call: {str(e)}")

        return {
            "messages": [
                AIMessage(
                    content="I'm having trouble processing your request. Please try again later."
                )
            ]
        }
