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

PAGE_CONTENT_TEMPLATE = "\nRelevant context from the fetched URL: {page_content}"

NOTES_CONTEXT_TEMPLATE = "User: {message} \nSystem: The user has the following notes: {notes} (Fetched from the Database). Only mention these notes when relevant to the conversation."

DOCUMENTS_CONTEXT_TEMPLATE = "Question: {message}\n\nContext from document files uploaded by the user:\n{{'document_names': {titles}, 'content': {content}}}"