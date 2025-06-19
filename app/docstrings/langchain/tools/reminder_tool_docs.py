"""Docstrings for reminder-related LangChain tools."""

CREATE_REMINDER = """
Create a new reminder (static or agent-based) for the user.

This tool schedules reminders that can either:
1. **STATIC** — fire a plain notification at a specific time (no LLM involvement).
2. **AI_AGENT** — wake the LLM (you) at a specific time to perform a task using available tools.

Use this tool only if you are confident that you (the agent) or the system can act on the reminder at runtime.

---

### 🔥 Reminder Types:

**STATIC Reminders**:
- Send a predefined notification (title + body).
- Use when the reminder is simple and doesn't require reasoning or access to tools.
- Payload must be of type `StaticReminderPayload`.

**AI_AGENT Reminders**:
- Triggers the LLM to take action at the scheduled time.
- You must write clear `instructions` that tell the agent exactly what to do.
- You are responsible for checking whether the required tools are available before creating an AI_AGENT reminder.
- Payload must be of type `AIAgentReminderPayload`.

---

### 🧠 Example: AI_AGENT Reminder Flow

User says:  
**"Remind me at 9PM every day to summarize my unread emails."**

Step-by-step:
1. Check: Do you have tools to access and summarize emails?
2. If yes, set `repeat = "0 21 * * *"` (daily at 9PM).
3. Use the following `AIAgentReminderPayload`:

```json
{
  "instructions": "The user wants a daily summary of unread emails. Fetch all unread emails at 9PM and summarize them in plain English. Output JSON: { 'title': ..., 'body': ... }"
}
````

If no tools are available for email access → do not create the reminder, and politely refuse the request.

---

### 🧘 Example: STATIC Reminder

User says:
**"Remind me to meditate at 7AM tomorrow."**

→ Create a one-time static reminder using:

```json
{
  "title": "Time to Meditate",
  "body": "Breathe deeply and take 10 minutes for yourself."
}
```

---

### Args

- **agent**  
  static or ai_agent reminder type.

- **repeat**  
  Cron expression for recurring reminders.  
  **Examples:**
  - `"0 9 * * *"` → every day at 9AM  
  - `"0 */2 * * *"` → every 2 hours  
  - `"30 18 * * 1-5"` → weekdays at 6:30PM  

- **scheduled_at** *(optional)*  
  ISO 8601 formatted datetime when the reminder should first run. If repeat is set, no need to specify this.
  
- **max_occurrences** *(optional)*  
  Maximum number of times the reminder will fire.

- **stop_after** *(optional)*  
  datetime after which no more executions will happen.

- **payload** *(required)*  
  Determines the type of reminder:

  - **For STATIC:**
    ```json
    { "title": string, "body": string }
    ```

  - **For AI_AGENT:**
    ```json
    { "instructions": string }
    ```
    Instructions must be explicit, comprehensive, and actionable using current tools.

---

### Returns:

* `str`: success message if reminder is successfully created, or an error message.
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
