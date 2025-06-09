from langchain_openai import ChatOpenAI

MODEL = "gpt-4o"


def init_llm():
    return ChatOpenAI(
        model=MODEL,
        temperature=0.1,
        streaming=True,
    )
