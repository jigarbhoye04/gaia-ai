from typing import Annotated
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from app.utils.weather_utils import user_weather


@tool
async def get_weather(
    location: Annotated[str, "Name of the location (e.g. Surat,IN)"],
) -> dict|str:
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

    # Send weather data to frontend via writer
    writer({
        "weather_data": weather_data,
        "location": location
    })

    # Return simple confirmation message
    return "Weather data sent to frontend. Do not write anything else. Just send the weather data."
