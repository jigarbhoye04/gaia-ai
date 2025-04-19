"""User prompts for chat service functionality."""

CONVERSATION_DESCRIPTION_GENERATOR = (
    "'{user_message}'\n"
    "Rephrase this text into a succinct topic description (maximum 4 words). "
    "Do not answer the message—simply summarize its subject. Do not add any sort of formatting or markdown, just respond in plaintext."
)

SEARCH_CONTEXT_TEMPLATE = """
You have access to accurate web search results using GAIA web search.
Below is the relevant context retrieved from the search:

{formatted_results}

You MUST include citations for all sourced content. Citations should be formatted with the link in markdown format, e.g., [1](https://example.com).
Ensure that every factual statement derived from the search results is properly cited.
Maintain accuracy, neutrality, and coherence when integrating this information.
"""


PAGE_CONTENT_TEMPLATE = """
Relevant information from the fetched URLs ({urls}):
{page_content}
**End of fetched content.**

These pages were retrieved using GAIA Webpage Fetch. Stay neutral and factual.
**You MUST cite all sources** in markdown format, e.g., [1](https://example.com).
"""

NOTES_CONTEXT_TEMPLATE = """
System: The user has the following relevant notes from the database:
{notes} .
Only reference these notes if they add value to the conversation and are relevant.
You have this information from your own database, so you can use it freely.


User: {message}

"""

DOCUMENTS_CONTEXT_TEMPLATE = "Question: {message}\n\nContext from document files uploaded by the user:\n{{'document_names': {titles}, 'content': {content}}}"
