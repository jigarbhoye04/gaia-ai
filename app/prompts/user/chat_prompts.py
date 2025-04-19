"""User prompts for chat service functionality."""

CONVERSATION_DESCRIPTION_GENERATOR = (
    "'{user_message}'\n"
    "Rephrase this text into a succinct topic description (maximum 4 words). "
    "Do not answer the message—simply summarize its subject. Do not add any sort of formatting or markdown, just respond in plaintext."
)

NOTES_CONTEXT_TEMPLATE = """
System: The user has the following relevant notes from the database:
{notes} .
Only reference these notes if they add value to the conversation and are relevant.
You have this information from your own database, so you can use it freely.


User: {message}

"""
