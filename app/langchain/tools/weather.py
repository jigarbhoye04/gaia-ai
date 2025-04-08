from langchain.tools import tool

from app.prompts.system.general import WEATHER_PROMPT
from app.utils.chat_utils import user_weather


@tool
async def get_weather(location: str, user_ip: str) -> str:
    weather_data = await user_weather(user_ip, location)

    return WEATHER_PROMPT.format(weather_data=weather_data)
