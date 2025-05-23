from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from app.config.settings import settings
from app.langchain.tools import (
    calendar_tool,
    file_tools,
    flowchart_tool,
    image_tool,
    mail_tool,
    memory_tool,
    search_tool,
    weather_tool,
    webpage_tool,
)

# MODEL = "llama-3.3-70b-versatile"
# MODEL = "gemini-2.5-pro-preview-03-25"
MODEL = "gpt-4o-mini"

tools = [
    webpage_tool.fetch_webpages,
    search_tool.deep_search_tool,
    search_tool.web_search_tool,
    memory_tool.create_memory,
    *mail_tool.mail_tools,
    weather_tool.get_weather,
    calendar_tool.fetch_calendar_list,
    calendar_tool.calendar_event,
    flowchart_tool.create_flowchart,
    image_tool.generate_image,
    file_tools.query_file,
]


def init_groq_client():
    def create_llm():
        return ChatOpenAI(
            model=MODEL,
            # google_api_key=settings.GEMINI_API_KEY,
            temperature=0.1,
            streaming=True,
        )
        # return ChatGroq(
        #     model=GROQ_MODEL,
        #     api_key=SecretStr(settings.GROQ_API_KEY),
        #     temperature=0.1,
        #     max_tokens=2048,
        #     streaming=True,
        # )

    return create_llm()
