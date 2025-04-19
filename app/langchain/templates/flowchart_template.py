from langchain.prompts import PromptTemplate

from app.langchain.prompts.flowchart_prompt import FLOWCHART_PROMPT

FLOWCHART_PROMPT_TEMPLATE = PromptTemplate.from_template(template=FLOWCHART_PROMPT)
