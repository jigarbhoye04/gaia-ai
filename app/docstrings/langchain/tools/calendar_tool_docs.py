"""Docstrings for calendar-related tools."""

CALENDAR_EVENT = """
Create calendar events from structured data provided by the LLM.

This tool processes calendar event information and returns a structured JSON response
that can be displayed to the user as calendar event options.

IMPORTANT: This tool does NOT directly add events to the calendar. Instead, it creates
a prompt on the frontend that the user must interact with. The user will need to click
a confirmation button to actually add the event to their calendar.

Use this tool when a user wants to schedule a meeting, appointment, call, or any time-based event.

You can provide either a single event object or an array of event objects.

Each EventCreateRequest object should contain:
- summary (str): Event title or name (required)
- description (str): Detailed description of the event (optional)
- is_all_day (bool): Boolean indicating if this is an all-day event (required)
- start (str): Start time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS±HH:MM) (required only for non-all-day events)
- end (str): End time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS±HH:MM) (required only for non-all-day events)
- calendar_id (str, optional): ID of the specific calendar to add event to
- calendar_name (str, optional): Display name of the calendar
- calendar_color (str, optional): Color code for the calendar in hex format (e.g. "#00bbff")

Args:
    event_data: Single EventCreateRequest object or array of EventCreateRequest objects

Returns:
    str: Confirmation message or JSON string containing formatted calendar event options for user confirmation.
"""

FETCH_CALENDAR_LIST = """
Retrieves the user's available calendars using their access token.

This tool securely accesses the user's access token from the config metadata
and calls the calendar service to fetch all available calendars.

Use this tool when a user asks to:
- View their calendar list
- Choose a calendar for adding events
- Verify which calendars are connected

Returns:
    str: Instructions on what to do next or an error message if the calendar list cannot be fetched.
"""
