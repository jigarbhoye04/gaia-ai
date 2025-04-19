from langchain.prompts import PromptTemplate
from app.langchain.prompts.fetch_prompts import FETCH_PROMPT

FETCH_TEMPLATE = PromptTemplate.from_template(template=FETCH_PROMPT)
