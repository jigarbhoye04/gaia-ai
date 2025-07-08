"""Docstrings for reminder-related LangChain tools."""

# TODO: Improve this prompt to be more concise and focused on the tool's purpose, LLM still sometimes misses that it has capabilities to create reminders with tools, not just static notifications.

CREATE_REMINDER = """
Create a new reminder (static or agent-based) for the user.

WORKFLOW:
1. Determine reminder type:
   • STATIC – simple title+body notification.
   • AI_AGENT – LLM-triggered task using available tools.

2. Schedule:
   • One-time: use `scheduled_at` (ISO 8601).
   • Recurring: use `repeat` (cron syntax).
   • If “start now” but repeat is out of sync, set `scheduled_at` to align first run.

3. Limits (only when user asks, explicitly or implicitly):
   • If user says “stop after 5 days” (daily reminders), set `max_occurrences=5`.
   • Or use `stop_after` (ISO 8601) to cut off after a date.

4. AI_AGENT only:
   • Before creating, verify you have the tools needed.
   • If not, refuse and explain the limitation.
   • Instructions must be fully self-contained: include context, tool names, inputs, and exact output format.
   • Each time the reminder fires, its `instructions` become the “user” message in a new conversation thread (AI_AGENT reminders only).

PAYLOAD:
  STATIC → {"title": str, "body": str}
  AI_AGENT → {"instructions": str}

Args:
    agent: "static" or "ai_agent"
    repeat: cron string (e.g. "0 9 * * *", "0 */2 * * *", "30 18 * * 1-5")
    scheduled_at: ISO 8601 timestamp for first run (optional)
    max_occurrences: int (optional)
    stop_after: ISO 8601 cutoff datetime (optional)
    payload: Required reminder content (see above)

Returns:
    str: success message or error message.
"""


LIST_USER_REMINDERS = """
List all scheduled reminders for a user.

Use this to retrieve all upcoming or past reminders for a user. It returns both static and agent-based reminders, optionally filtered by status.

Args:
    status (str, optional): Filter by state (e.g., "scheduled", "completed").

Returns:
    list[dict]: List of reminder objects.
"""


GET_REMINDER = """
Get full details of a specific reminder by ID.

Use this to inspect a reminder's type, schedule, payload, and current state. Especially useful before editing or cancelling.

Args:
    reminder_id (str): The ID of the reminder to fetch.

Returns:
    dict: Full reminder object or error.
"""


DELETE_REMINDER = """
Cancel a scheduled reminder.

Use this when a user no longer wants a reminder to run. It marks the reminder as cancelled and prevents future execution.

Args:
    reminder_id (str): The ID of the reminder to cancel.

Returns:
    dict: Confirmation of cancellation or error.
"""


UPDATE_REMINDER = """
Update an existing reminder’s configuration.

Use this to modify reminder schedule, recurrence, or payload. Useful for rescheduling or changing agent behavior dynamically.

Args:
    reminder_id (str): The ID of the reminder to update.
    repeat (str, optional): New cron pattern for recurrence.
    max_occurrences (int, optional): New limit on runs.
    stop_after (str, optional): New expiration timestamp.
    payload (dict, optional): New metadata/context for the reminder.

Returns:
    dict: Update status or error.
"""


SEARCH_REMINDERS = """
Search through user's reminders using text query.

Use this to semantically search reminders using keywords found in their title, type, or payload. It works across static and agent-based reminders.

Args:
    query (str): Natural language query or keyword (e.g., "doctor", "follow up").

Returns:
    list[dict]: Matching reminders or error.
"""
