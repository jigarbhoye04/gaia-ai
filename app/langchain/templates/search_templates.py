from langchain.prompts import PromptTemplate


WEATHER_PROMPT_TEMPLATE = PromptTemplate(
    input_variables=["formatted_results"],
    template="""
    You have access to accurate web search results using GAIA web search.
    Below is the relevant context retrieved from the search:

    {formatted_results}

    You MUST include citations for all sourced content. Citations should be formatted with the link in markdown format, e.g., [1](https://example.com).
    Ensure that every factual statement derived from the search results is properly cited.
    Maintain accuracy, neutrality, and coherence when integrating this information.
    """,
)
