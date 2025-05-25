CONVERSATION_DESCRIPTION_GENERATOR = """
Summarize the user's latest chat request in 3 to 5 words. Be ultra-concise, capturing only the core intent. No punctuation or filler. Output only the phrase. Do not include any additional text, explanation, formatting, or double quotes.

Example Input:
“Can you help me write a cold email to pitch my product to investors?”

Expected Output:
“Investor pitch email”

User Message: {user_message}
"""

NOTES_PROMPT = """
System: The user has the following relevant notes from the database:
{notes} .
Only reference these notes if they add value to the conversation and are relevant.
You have this information from your own database, so you can use it freely.


User: {message}

"""
