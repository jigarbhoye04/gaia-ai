from langchain_openai import ChatOpenAI

MODEL = "gpt-4o-mini"


def init_llm(streaming: bool = True):
    return ChatOpenAI(
        model=MODEL,
        temperature=0.1,
        streaming=streaming,
    )
