"""User prompts for chat service functionality."""

CONVERSATION_DESCRIPTION_GENERATOR = """
This prompt helps you generate concise 2-5 word descriptions of user requests to display in a UI sidebar. These descriptions serve as quick references to conversation topics for users navigating through their chat history.
Instructions
Generate a brief, descriptive label that captures the essence of what the user is requesting or discussing.
When creating descriptions:

For substantive requests: Focus on the primary topic or action (e.g., "Python Code Review")
For greetings or simple messages: Use appropriate labels like "Greeting," "Introduction," or "Chat Initiation"
For vague requests: Describe the general nature (e.g., "General Inquiry")
For multi-part requests: Focus on the main theme or first major topic
For requests beyond your knowledge: Still describe what was asked, not your limitations

Key Guidelines

Always provide a description, never return "no description" or similar
Keep descriptions between 2-5 words
Use natural, conversational language
Prioritize clarity and relevance
Focus on the request itself, not your ability to fulfill it
Capitalize first letters of significant words

Examples

"Hey!" → "Greeting"
"How are you doing?" → "Casual Conversation"
"Write me a poem about spring" → "Spring Poem Request"
"Can you explain quantum physics?" → "Quantum Physics Explanation"
"What happened in yesterday's election?" → "Election Results Query"
"I need help with my resume and also want to know about machine learning careers" → "Resume Help"
"Tell me about the new iPhone" → "New iPhone Information"
"..." → "Message Without Text"

Remember: Every user message needs a description, no matter how brief or vague.
Do it for this message: {user_message}
"""

NOTES_PROMPT = """
System: The user has the following relevant notes from the database:
{notes} .
Only reference these notes if they add value to the conversation and are relevant.
You have this information from your own database, so you can use it freely.


User: {message}

"""
