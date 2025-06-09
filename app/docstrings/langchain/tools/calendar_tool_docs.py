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

FETCH_CALENDAR_EVENTS = """
Fetch calendar events from the user's selected calendars.

This tool retrieves events from the user's calendar based on optional filters like time range
and specific calendar selection. It uses the user's access token to securely fetch events.

Use this tool when a user wants to:
- View their upcoming events
- Check their schedule for a specific time period
- See events from specific calendars

Args:
    user_id (str): The user's unique identifier
    time_min (str, optional): Start time filter in ISO 8601 format (e.g., "2023-12-01T00:00:00Z")
    time_max (str, optional): End time filter in ISO 8601 format (e.g., "2023-12-31T23:59:59Z")
    selected_calendars (List[str], optional): List of calendar IDs to fetch events from

Returns:
    str: JSON string containing events data, total count, selected calendars, and pagination token
"""

SEARCH_CALENDAR_EVENTS = """
Search for specific calendar events based on a text query.

This tool searches through the user's calendar events to find matches based on event titles,
descriptions, or calendar names. It performs case-insensitive text matching.

Use this tool when a user wants to:
- Find events containing specific keywords
- Search for meetings with certain people
- Look for events related to specific topics

Args:
    query (str): Search query text to match against event titles, descriptions, and calendar names
    user_id (str): The user's unique identifier
    time_min (str, optional): Start time filter in ISO 8601 format
    time_max (str, optional): End time filter in ISO 8601 format

Returns:
    str: JSON string containing matching events, search query, and result counts
"""

VIEW_CALENDAR_EVENT = """
Retrieve detailed information about a specific calendar event.

This tool fetches complete details for a single calendar event using its event ID and calendar ID.
It provides comprehensive information about the event including all metadata.

Use this tool when a user wants to:
- View full details of a specific event
- Get comprehensive information about an event they mentioned
- Check event details before making modifications

Args:
    event_id (str): The unique identifier of the calendar event
    calendar_id (str): The calendar ID containing the event (defaults to "primary")

Returns:
    str: JSON string containing the complete event details, event ID, and calendar ID
"""
