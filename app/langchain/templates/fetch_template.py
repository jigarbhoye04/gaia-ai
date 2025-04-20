from langchain.prompts import PromptTemplate
from app.langchain.prompts.fetch_prompts import FETCH_PROMPT

FETCH_TEMPLATE = PromptTemplate(
    input_variables=["urls", "page_content"],
    template=FETCH_PROMPT,
)
