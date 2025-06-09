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
- See what calendars they have access to

USAGE NOTES:
- This tool requires NO parameters - it automatically uses the user's credentials from config
- Always use this when the user wants to see their available calendars
- Don't use this tool for fetching events - use fetch_calendar_events instead

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
- Get a general overview of their calendar

PARAMETER USAGE GUIDELINES:

TIME FILTERS (time_min, time_max):
- DEFAULT: Omit both parameters to get upcoming events (system defaults to current time forward)
- USE time_min WHEN: User specifies "events after [date]", "starting from [date]", or "from [date] onwards"
- USE time_max WHEN: User specifies "events before [date]", "until [date]", or "up to [date]"
- USE BOTH WHEN: User specifies a specific date range like "events between [date1] and [date2]"
- DON'T USE: For general requests like "show my events" or "what's on my calendar"

CALENDAR SELECTION (selected_calendars):
- DEFAULT: Omit to fetch from user's preferred calendars (from their settings)
- USE WHEN: User specifically mentions calendar names like "events from my work calendar"
- DON'T USE: For general calendar viewing - let the system use user preferences

Args:
    user_id (str): The user's unique identifier (always required)
    time_min (str, optional): Start time filter in ISO 8601 format - only use when user specifies a start date
    time_max (str, optional): End time filter in ISO 8601 format - only use when user specifies an end date
    selected_calendars (List[str], optional): List of calendar IDs - only use when user specifies particular calendars

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

IMPORTANT: By default, search across ALL calendar events regardless of date/time. 
Only use time_min and time_max filters when the user specifically requests to limit 
the search to a particular date range. For general keyword searches, omit these 
parameters to search through the entire calendar history.

Args:
    query (str): Search query text to match against event titles, descriptions, and calendar names
    user_id (str): The user's unique identifier
    time_min (str, optional): Start time filter in ISO 8601 format - ONLY use when user specifies a date range
    time_max (str, optional): End time filter in ISO 8601 format - ONLY use when user specifies a date range

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
- See complete event information including attendees, location, etc.

PARAMETER USAGE GUIDELINES:

EVENT ID (event_id):
- ALWAYS REQUIRED: You must have the specific event ID to use this tool
- GET FROM: Previous calendar searches, event lists, or when user references a specific event
- DON'T USE: If you don't have a specific event ID - use search or fetch tools instead

CALENDAR ID (calendar_id):
- DEFAULT: Use "primary" (the user's main calendar) when not specified
- USE SPECIFIC ID WHEN: You know the event is in a particular calendar (from previous searches)
- USE "primary" WHEN: User doesn't specify a calendar or for general event viewing
- DON'T GUESS: If unsure, stick with "primary" - the system will find the event

WHEN NOT TO USE THIS TOOL:
- User asks for "all events" or "upcoming events" → use fetch_calendar_events
- User asks to "find events about X" → use search_calendar_events  
- User asks for "today's events" → use fetch_calendar_events with time filters

Args:
    event_id (str): The unique identifier of the calendar event (REQUIRED - must be obtained from previous searches/lists)
    calendar_id (str): The calendar ID containing the event (defaults to "primary" if not specified)

Returns:
    str: JSON string containing complete event details including all metadata
"""
