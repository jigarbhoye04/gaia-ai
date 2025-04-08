from typing import Annotated
from langchain_core.tools import tool
from app.langchain.templates.weather_template import WEATHER_PROMPT_TEMPLATE
from app.utils.chat_utils import user_weather


@tool
async def get_weather(
    location: Annotated[str, "Name of the location (e.g. Surat,IN)"],
) -> str:
    """
    Fetches and formats the weather report for a given location.

    This tool queries OpenWeather API using the provided location name and formats
    the data into a user-friendly weather summary using a prompt template. Designed
    for LangChain-compatible agents to deliver natural language outputs.

    Args:
        location (str): The location for which to retrieve the weather report.

    Returns:
        str: A natural language weather summary.
    """
    weather_data = await user_weather(location)
    formatted_output = WEATHER_PROMPT_TEMPLATE.format(weather_data=weather_data)
    return formatted_output
