import json
import pprint
from typing import Annotated, List

from langchain_core.runnables.config import RunnableConfig
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from app.models.calendar_models import EventCreateRequest

from app.config.loggers import chat_logger as logger
from app.services.calendar_service import list_calendars
from app.langchain.templates.calendar_template import CALENDAR_PROMPT_TEMPLATE


@tool(parse_docstring=True)
async def calendar_event(event_data_array: List[EventCreateRequest]) -> str:
    """
    Create calendar events from structured data provided by the LLM.

    This tool processes calendar event information and returns a structured JSON response
    that can be displayed to the user as calendar event options.

    IMPORTANT: This tool does NOT directly add events to the calendar. Instead, it creates
    a prompt on the frontend that the user must interact with. The user will need to click
    a confirmation button to actually add the event to their calendar.

    Use this tool when a user wants to schedule a meeting, appointment, call, or any time-based event.

    Always provide event data as an array, even if there's only one event.
    
    Each EventCreateRequest object in the array should contain:
    - summary (str): Event title or name (required)
    - description (str): Detailed description of the event (optional)
    - is_all_day (bool): Boolean indicating if this is an all-day event (required)
    - start (str): Start time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS±HH:MM) (required only for non-all-day events)
    - end (str): End time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS±HH:MM) (required only for non-all-day events)
    - calendar_id (str, optional): ID of the specific calendar to add event to
    - calendar_name (str, optional): Display name of the calendar
    - calendar_color (str, optional): Color code for the calendar in hex format (e.g. "#00bbff")

    Args:
        event_data_array: Array of EventCreateRequest objects for calendar events to create

    Returns:
        str: Confirmation message or JSON string containing formatted calendar event options for user confirmation.
    """
    try:
        logger.info("===== CALENDAR EVENT TOOL CALLED =====")
        logger.info("Processing calendar event with data:")
        logger.info(pprint.pformat(event_data_array, indent=2, width=100))

        # Validate the event data structure
        if not event_data_array or not isinstance(event_data_array, list):
            logger.error("Invalid calendar event data format - must be a list")
            return json.dumps(
                {
                    "error": "Calendar event data must be provided as an array",
                    "intent": "calendar",
                    "calendar_options": [],
                    "prompt": str(CALENDAR_PROMPT_TEMPLATE.invoke({})),
                }
            )

        calendar_options = []
        validation_errors = []

        logger.info(f"Processing {len(event_data_array)} calendar events")

        # Process each event with validation
        for event in event_data_array:
            try:
                # Validate event fields based on whether it's an all-day event
                if event.is_all_day:
                    # For all-day events, start and end are optional
                    # They'll be handled in the service with defaults if missing
                    pass
                else:
                    # For time-specific events, both start and end are required
                    if not event.start or not event.end:
                        raise ValueError("Start and end times are required for time-specific events")
                
                # Add the validated event
                calendar_options.append(event.model_dump())
                logger.info(f"Added calendar event: {event.summary}")

            except Exception as e:
                error_msg = f"Error processing calendar event: {e}"
                logger.error(error_msg)
                validation_errors.append(error_msg)

        # Return validation errors if any
        if validation_errors and not calendar_options:
            logger.error(f"Calendar event validation failed: {validation_errors}")
            return json.dumps(
                {
                    "error": "Calendar event validation failed",
                    "details": validation_errors,
                    "intent": "calendar",
                    "calendar_options": [],
                    "prompt": str(CALENDAR_PROMPT_TEMPLATE.invoke({})),
                }
            )

        # Return the successfully processed events
        writer = get_stream_writer()

        # Send calendar options to frontend via writer
        writer({"calendar_options": calendar_options})

        logger.info("Calendar event processing successful")
        logger.info(f"Sent {len(calendar_options)} calendar options to frontend")
        return "Calendar options sent to frontend"

    except Exception as e:
        error_msg = f"Error processing calendar event: {e}"
        logger.error(error_msg)
        return json.dumps(
            {
                "error": "Unable to process calendar event",
                "details": str(e),
                "intent": "calendar",
                "calendar_options": [],
                "prompt": str(CALENDAR_PROMPT_TEMPLATE.invoke({})),
            }
        )


@tool
async def fetch_calendar_list(
    config: RunnableConfig,
):
    """
    Retrieves the user's available calendars using their access token.

    This tool securely accesses the user's access token from the config metadata
    and calls the calendar service to fetch all available calendars.

    Use this tool when a user asks to:
    - View their calendar list
    - Choose a calendar for adding events
    - Verify which calendars are connected

    Returns:
        str: JSON-formatted string containing the user's calendar list, or an error message.
    """
    try:
        logger.info("===== FETCH CALENDAR LIST TOOL CALLED =====")

        if not config:
            logger.error("Missing configuration data")
            return {"error": "Missing configuration", "calendars": []}

        access_token = config.get("configurable", {}).get("access_token")
        logger.info(f"Access token available: {bool(access_token)}")

        if not access_token:
            logger.error("Missing access token in config")
            return {"error": "Missing access token", "calendars": []}

        calendars = await list_calendars(access_token=access_token, short=True)
        if calendars is None:
            logger.error("Unable to fetch calendars - no data returned")
            return {"error": "Unable to fetch calendars", "calendars": []}

        logger.info(f"Fetched {len(calendars)} calendars")
        logger.info(pprint.pformat(calendars, indent=2, width=100))
        return {"calendars": calendars}
    except Exception as e:
        error_msg = f"Error fetching calendars: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "calendars": []}
