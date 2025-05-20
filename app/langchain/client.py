from langchain_groq import ChatGroq
from pydantic import SecretStr

from app.config.settings import settings
from app.langchain.tools import (
    calendar_tool,
    file_tools,
    flowchart_tool,
    image_tool,
    memory_tool,
    search_tool,
    weather_tool,
    webpage_tool,
)

# GROQ_MODEL = "llama-3.1-8b-instant"
# GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_MODEL = "meta-llama/Llama-4-Maverick-17B-128E-Instruct"
# GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

tools = [
    webpage_tool.fetch_webpages,
    search_tool.deep_search_tool,
    search_tool.web_search_tool,
    memory_tool.create_memory,
    weather_tool.get_weather,
    calendar_tool.fetch_calendar_list,
    calendar_tool.calendar_event,
    flowchart_tool.create_flowchart,
    image_tool.generate_image,
    file_tools.fetch_file,
    file_tools.query_file,
]


def init_groq_client():
    def create_llm():
        return ChatGroq(
            model=GROQ_MODEL,
            api_key=SecretStr(settings.GROQ_API_KEY),
            temperature=0.6,
            max_tokens=2048,
            streaming=True,
        )

    llm_with_tools = create_llm().bind_tools(tools=tools)
    llm_without_tools = create_llm()

    return llm_with_tools, llm_without_tools, tools
