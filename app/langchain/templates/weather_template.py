from langchain.prompts import PromptTemplate
from app.langchain.prompts.weather_prompt import WEATHER_PROMPT

WEATHER_PROMPT_TEMPLATE = PromptTemplate(
    input_variables=["weather_data"],
    template=WEATHER_PROMPT,
)
