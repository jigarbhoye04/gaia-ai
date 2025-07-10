from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

MODEL = "gpt-4o-mini"
GEMINI_MODEL = "gemini-1.5-flash"


def init_llm(streaming: bool = True):
    return ChatOpenAI(
        model=MODEL,
        temperature=0.1,
        streaming=streaming,
    )


def init_gemini_llm():
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        temperature=0.1,
    )
