SUGGEST_FOLLOW_UP_ACTIONS = """
Based on the conversation so far, suggest 2-4 relevant follow-up actions that the user might want to do next.

This tool provides contextual suggestions for what the user might want to do next,
making the conversation flow more natural and productive.

When to use:
- After completing a task or providing information
- When the response might lead to natural next steps
- To guide users toward related functionality
- To enhance user engagement and discoverability

Input:
- actions: Array of follow-up action suggestions (3-5 recommended)

Each action should be:
- Clear and actionable (e.g., "Create a reminder for this", "Add this to my calendar")
- Contextually relevant to the current conversation
- Short and concise (under 50 characters)
- Specific rather than generic

Consider:
- What tools or features were just used
- What data was generated or retrieved
- Natural next steps in the workflow
- Related functionality that might be helpful

Make the actions:
- Clear and actionable (e.g., "Create a reminder for this", "Add this to my calendar")
- Contextually relevant to what just happened
- Short and concise (under 50 characters each)
- Specific rather than generic

Important: If there are no genuinely relevant or helpful follow-up actions based on the current context,
return an empty array. Do not force suggestions or create generic actions just to fill the array.
Quality over quantity - only suggest actions that would truly be useful to the user at this moment.

{format_instructions}

Conversation context: {conversation_summary}

Your agent prompt is this (The purpose of the agent prompt is for you to understand which tools you have access too and you have to provide follow up actions accordingly to the user):
{agent_prompt}
"""
