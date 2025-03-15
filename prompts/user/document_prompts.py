"""User prompts for document handling and querying."""

DOCUMENT_QUERY_LARGE = """Question: {question}

Context from documents uploaded by the user:
{{'document_names': {titles}, 'content': {content}}}
"""

DOCUMENT_QUERY_SMALL = """Question: {question}

Context from documents uploaded by the user:
{{'document_name': '{filename}', 'content': '{text}'}}
"""