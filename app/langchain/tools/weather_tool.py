from typing import Annotated
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from app.langchain.templates.weather_template import WEATHER_PROMPT_TEMPLATE
from app.utils.weather_utils import user_weather
import json


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
        str: A JSON string containing both the formatted weather text and raw weather data.
    """
    writer = get_stream_writer()
    writer({"progress": f"Fetching weather information for {location}..."})

    # Get the raw weather data
    weather_data = await user_weather(location)

    # Format for LLM consumption
    formatted_output = WEATHER_PROMPT_TEMPLATE.format(weather_data=weather_data)

    # Create a response object with both the formatted text and the raw data
    response = {
        "formatted_text": formatted_output,  # For the LLM to use
        "raw_weather_data": weather_data,  # For the frontend to use
        "location": location,  # The requested location
    }

    # Return as JSON string that can be parsed both by LLM and the frontend
    return json.dumps(response)
