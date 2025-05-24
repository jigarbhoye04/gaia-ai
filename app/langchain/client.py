from langchain_openai import ChatOpenAI
from app.langchain.tools import (
    calendar_tool,
    file_tools,
    flowchart_tool,
    image_tool,
    mail_tool,
    search_tool,
    weather_tool,
    webpage_tool,
)

MODEL = "gpt-4o-mini"

# Define tools that should always be accessible to the agent directly
ALWAYS_AVAILABLE_TOOLS = [
    search_tool.web_search_tool,
    search_tool.deep_search_tool,
    webpage_tool.fetch_webpages,
    file_tools.query_file,
]

# All other tools will be accessible through vector search
tools = [
    *mail_tool.mail_tools,
    calendar_tool.fetch_calendar_list,
    calendar_tool.calendar_event,
    flowchart_tool.create_flowchart,
    image_tool.generate_image,
    weather_tool.get_weather,
]


def init_groq_client():
    def create_llm():
        return ChatOpenAI(
            model=MODEL,
            temperature=0.1,
            streaming=True,
        )

    return create_llm()
