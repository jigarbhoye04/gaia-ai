import json
import pprint
from typing import Annotated, List

from langchain_core.runnables.config import RunnableConfig
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from app.models.calendar_models import EventCreateRequest

from app.config.loggers import chat_logger as logger
from app.services.calendar_service import list_calendars
from app.langchain.templates.calendar_template import (
    CALENDAR_PROMPT_TEMPLATE,
    CALENDAR_LIST_TEMPLATE,
)


@tool(parse_docstring=True)
async def calendar_event(
    event_data: List[EventCreateRequest] | EventCreateRequest,
    config: RunnableConfig,
) -> str:
    """
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
    try:
        logger.info("===== CALENDAR EVENT TOOL CALLED =====")
        logger.info("Processing calendar event with data:")
        logger.info(pprint.pformat(event_data, indent=2, width=100))

        # Normalize input to always work with a list
        if isinstance(event_data, EventCreateRequest):
            # Single event object - convert to list
            event_list = [event_data]
            logger.info("Received single event object, converting to list")
        elif isinstance(event_data, list):
            # Already a list
            event_list = event_data
            logger.info(f"Received list with {len(event_list)} events")
        else:
            # Invalid type
            logger.error(f"Invalid event data type: {type(event_data)}")
            return json.dumps(
                {
                    "error": "Calendar event data must be an EventCreateRequest object or a list of EventCreateRequest objects",
                    "intent": "calendar",
                    "calendar_options": [],
                    "prompt": str(CALENDAR_PROMPT_TEMPLATE.invoke({})),
                }
            )

        # Validate non-empty
        if not event_list:
            logger.error("Empty event list provided")
            return json.dumps(
                {
                    "error": "At least one calendar event must be provided",
                    "intent": "calendar",
                    "calendar_options": [],
                    "prompt": str(CALENDAR_PROMPT_TEMPLATE.invoke({})),
                }
            )

        calendar_options = []
        validation_errors = []

        logger.info(f"Processing {len(event_list)} calendar events")

        # Process each event with validation
        for event in event_list:
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
        writer({"calendar_options": calendar_options, "intent": "calendar"})

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
) -> str | dict:
    """
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
    try:
        if not config:
            logger.error("Missing configuration data")
            return "Unable to access calendar configuration. Please try again."

        access_token = config.get("configurable", {}).get("access_token")

        if not access_token:
            logger.error("Missing access token in config")
            return "Unable to access your calendar. Please ensure you're logged in with calendar permissions."

        calendars = await list_calendars(access_token=access_token, short=True)
        if calendars is None:
            logger.error("Unable to fetch calendars - no data returned")
            return "Unable to fetch your calendars. Please ensure your calendar is connected."

        logger.info(f"Fetched {len(calendars)} calendars")

        formatted_response = CALENDAR_LIST_TEMPLATE.format(
            calendars=json.dumps(calendars)
        )

        return formatted_response
    except Exception as e:
        error_msg = f"Error fetching calendars: {str(e)}"
        logger.error(error_msg)
        return f"Error fetching calendars: {str(e)}"
