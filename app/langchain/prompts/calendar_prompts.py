"""
Calendar-related prompt templates for the chat agent.
"""

CALENDAR_PROMPT = """
Use this template to explain calendar events to the user. The user has requested to create a calendar event, and the event details have been processed.

Remember:
- The event is NOT yet added to the calendar.
- The user must confirm the event details by clicking a confirmation button in the interface.
- The event details will be displayed as an interactive card that the user can review before confirming.

Your response should:
1. Clearly state that you've prepared the calendar event based on their request
2. Mention that they need to review and confirm the details
3. Tell them to click the confirmation button that appears in the interface if they want to add this event
4. Be concise and friendly

DO NOT:
- Suggest that the event has been added already
- Ask for additional details about the event
- Include technical details about the API or process
- Present the event details as your own text - they will be displayed separately

Example response:
"I've prepared a calendar event based on your request. Please review the details that appear in the calendar card and click the confirmation button if you'd like to add this to your calendar."
"""
