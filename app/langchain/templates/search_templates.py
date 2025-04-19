from langchain.prompts import PromptTemplate
from app.langchain.prompts.search_prompts import SEARCH_PROMPT, DEEP_SEARCH_PROMPT

SEARCH_TEMPLATE = PromptTemplate(
    input_variables=["formatted_results"],
    template=SEARCH_PROMPT,
)


DEEP_SEARCH_TEMPLATE = PromptTemplate(
    input_variables=["formatted_results"],
    template=DEEP_SEARCH_PROMPT,
)
