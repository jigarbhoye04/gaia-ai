from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from app.config.settings import settings

MODEL = "gpt-4o"


def init_llm():
    return ChatOpenAI(
        model=MODEL,
        temperature=0.1,
        streaming=True,
    )


def init_groq_llm():
    """Initialize the Groq LLM client."""

    return ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=SecretStr(settings.GROQ_API_KEY),
        temperature=0.1,
        streaming=True,
    )
