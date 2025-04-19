from langchain.prompts import PromptTemplate
from app.langchain.prompts.fetch_prompt import FETCH_PROMPT

FETCH_TEMPLATE = PromptTemplate.from_template(template=FETCH_PROMPT)
