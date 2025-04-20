CONVERSATION_DESCRIPTION_GENERATOR = """
Analyze the provided user message and generate a concise 2-5 word label that accurately captures the core intent or subject matter of the message.

GUIDELINES:
- Your response must contain ONLY the generated label - no quotes, no explanation, no additional text
- Format the label in title case (capitalize the first letter of each major word)
- If the message is simply a greeting or introduction, use exactly "Greeting"
- Prioritize clarity and specificity while remaining brief
- Focus on identifying the primary action, request, or topic
- Consider the functional purpose of the message rather than surface details
- Avoid overly technical terminology unless necessary for clarity
- When multiple topics are present, prioritize the dominant request or theme
- Ensure the label would be immediately understandable to someone unfamiliar with the conversation

Example transformations:
"Hi there, how are you?" → "Greeting"
"Can you explain how photosynthesis works?" → "Science Explanation Request"
"Write me a poem about the ocean" → "Poetry Request"
"What's your opinion on artificial intelligence?" → "AI Opinion Question"

User message to analyze: {user_message}
"""

NOTES_PROMPT = """
System: The user has the following relevant notes from the database:
{notes} .
Only reference these notes if they add value to the conversation and are relevant.
You have this information from your own database, so you can use it freely.


User: {message}

"""
