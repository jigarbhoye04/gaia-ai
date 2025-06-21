"""Docstrings for reminder-related LangChain tools."""

# TODO: Improve this prompt to be more concise and focused on the tool's purpose, LLM still sometimes misses that it has capabilities to create reminders with tools, not just static notifications.
CREATE_REMINDER = """
Create a new reminder (static or agent-based) for the user.

**WORKFLOW:**
1. **Determine reminder type** based on user request:
   - Simple notification → use STATIC type
   - Task requiring tools/actions → use AI_AGENT type

2. **Set scheduling** using either:
   - `scheduled_at` for one-time reminders (ISO 8601 datetime)
   - `repeat` for recurring reminders (cron expression)

3. **For AI_AGENT reminders - Check tool availability:**
   - Verify you have the necessary tools to complete the task. Use the `retrieve_tools` function to get available tools.
   - If tools are missing, politely refuse and suggest alternatives

4. **Create payload** based on type:
   - STATIC: Simple `{"title": str, "body": str}`
   - AI_AGENT: Comprehensive `{"instructions": str}` (self-contained)

5. **Optional: Set limits** for recurring reminders:
   - `max_occurrences` to limit total executions
   - `stop_after` to set end date

⚠️  **CRITICAL FOR AI_AGENT**: The reminder agent starts with ZERO context from this conversation. 
Write completely self-contained instructions that include ALL necessary context, user preferences, 
tools to use, output format, and task details.

**Reminder Types:**
- **STATIC**: Simple notification (title + body) sent at scheduled time
- **AI_AGENT**: Activates LLM with tools to perform tasks at scheduled time

Args:
    agent (str): Reminder type - "static" for notifications, "ai_agents" for tool-based tasks
    repeat (str, optional): Cron expression for recurring reminders
        Examples: "0 9 * * *" (daily 9AM), "30 18 * * 1-5" (weekdays 6:30PM)
    scheduled_at (str, optional): ISO 8601 datetime for one-time execution
        Use this OR repeat, not both
    max_occurrences (int, optional): Maximum number of executions for recurring reminders
    stop_after (str, optional): ISO 8601 datetime to stop recurring executions
    payload (dict): Reminder content based on agent type:
        - STATIC: {"title": str, "body": str}
        - AI_AGENT: {"instructions": str} (must be completely self-contained)

Returns:
    str: Success message if reminder created, or error message if failed
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
