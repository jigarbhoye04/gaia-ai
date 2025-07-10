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

DELETE_CALENDAR_EVENT = """
Delete a calendar event after searching and finding it by name or description.

This tool allows users to delete calendar events using non-exact event names. It performs the
following steps:
1. Search for events matching the provided query
2. Find the best matching event
3. Send the event details to the frontend for user confirmation
4. Delete the event only after user confirmation

IMPORTANT: This tool does NOT directly delete events. Instead, it finds the event and sends
deletion confirmation options to the frontend. The user must click a confirmation button
to actually delete the event.

Use this tool when a user wants to:
- Delete an event by mentioning its name (even if not exact)
- Remove a meeting or appointment
- Cancel an event they reference by description
- Delete events like "delete my meeting with John" or "cancel the dentist appointment"

The tool supports fuzzy matching, so users can say:
- "Delete my meeting with Sarah" (will find "Team Meeting with Sarah and Mike")
- "Cancel the dentist appointment" (will find "Dentist - Annual Checkup")
- "Remove the 3pm call" (will find events around that time)

Args:
    query (str): Search query to find the event to delete (e.g., "meeting with John", "dentist appointment")
    user_id (str): The user's unique identifier

Returns:
    str: Confirmation message or JSON string containing event deletion options for user confirmation.
"""

EDIT_CALENDAR_EVENT = """
Edit/update a calendar event after searching and finding it by name or description.

This tool allows users to edit calendar events using non-exact event names. It performs the
following steps:
1. Search for events matching the provided query
2. Find the best matching event
3. Apply the requested changes
4. Send the updated event details to the frontend for user confirmation
5. Update the event only after user confirmation

IMPORTANT: This tool does NOT directly update events. Instead, it finds the event, applies
changes, and sends update confirmation options to the frontend. The user must click a
confirmation button to actually update the event.

Use this tool when a user wants to:
- Update an event by mentioning its name (even if not exact)
- Change the time, description, or title of a meeting
- Modify event details they reference by description
- Edit events like "move my meeting with John to 3pm" or "change the dentist appointment to tomorrow"

The tool supports fuzzy matching and partial updates:
- "Move my meeting with Sarah to 3pm" (will find and update the time)
- "Change the dentist appointment to tomorrow" (will find and update the date)
- "Update the project meeting description" (will find and update description)

Args:
    query (str): Search query to find the event to edit (e.g., "meeting with John", "dentist appointment")
    user_id (str): The user's unique identifier
    summary (str, optional): New event title/summary
    description (str, optional): New event description
    start (str, optional): New start time in ISO 8601 format
    end (str, optional): New end time in ISO 8601 format
    is_all_day (bool, optional): Whether to make it an all-day event
    timezone (str, optional): New timezone for the event

Returns:
    str: Confirmation message or JSON string containing event update options for user confirmation.
"""
