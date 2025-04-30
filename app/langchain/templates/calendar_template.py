from langchain_core.prompts import PromptTemplate
from app.langchain.prompts.calendar_prompts import CALENDAR_PROMPT

CALENDAR_PROMPT_TEMPLATE = PromptTemplate(
    input_variables=[],
    template=CALENDAR_PROMPT,
)
