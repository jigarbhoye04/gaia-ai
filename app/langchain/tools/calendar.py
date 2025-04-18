import json
from datetime import datetime
from typing import Annotated, Dict, List

from langchain_core.tools import tool
from pydantic import ValidationError

from app.config.loggers import chat_logger as logger
from app.models.chat_models import CalIntentOptions
from app.services.calendar_service import list_calendars


@tool
async def calendar_event(
    event_data: Annotated[
        List[Dict],
        "Array of calendar event data with fields: summary, description, start, end, is_all_day",
    ],
) -> str:
    """
    Create calendar events from structured data provided by the LLM.

    This tool processes calendar event information and returns a structured JSON response
    that can be displayed to the user as calendar event options. When a user expresses
    intent to schedule something, this tool formats that information for the frontend.

    IMPORTANT: This tool does NOT directly add events to the calendar. Instead, it creates
    a prompt on the frontend that the user must interact with. The user will need to click
    a confirmation button to actually add the event to their calendar.

    Use this tool when a user wants to:
    1. Schedule a meeting, appointment, call, or any time-based event
    2. Add a reminder or task with a specific date and time
    3. Create a calendar entry with any combination of title, description, date, time
    4. Book time slots for activities or commitments

    Always provide event data as an array, even if there's only one event.

    Args:
        event_data: Array of dictionaries containing calendar event details with fields:
            - summary (str): Event title or name (required)
            - description (str): Detailed description of the event (optional)
            - start (str): Start time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS±HH:MM) (required)
            - end (str): End time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS±HH:MM) (required)
            - is_all_day (bool): Boolean indicating if this is an all-day event (required)
            - calendar_id (str, optional): ID of the specific calendar to add event to

    Returns:
        JSON string containing formatted calendar event options that can be rendered on
        the frontend, allowing the user to review and confirm the event details before
        they are added to their calendar.

    Example:
        When a user says "Schedule a team meeting tomorrow at 2pm for 1 hour", this tool
        will process that intent and create a structured calendar event with the appropriate
        summary, start and end times, returning options for the user to confirm.

    Note:
        A "calendar_options" field will be returned containing the list of event options. These options will
        be displayed to the user for confirmation before the actual calendar event is created.
    """
    try:
        print(f"{event_data=}")
        # Validate the event data structure
        if not event_data or not isinstance(event_data, list):
            return json.dumps(
                {
                    "error": "Calendar event data must be provided as an array",
                    "intent": "calendar",
                    "calendar_options": [],
                }
            )

        calendar_options = []
        validation_errors = []

        logger.info(f"Processing {len(event_data)} calendar events")

        # Process each event with validation
        for idx, event_dict in enumerate(event_data):
            try:
                # Convert dict to CalIntentOptions
                try:
                    # Ensure is_all_day is a boolean
                    if "is_all_day" in event_dict and not isinstance(
                        event_dict["is_all_day"], bool
                    ):
                        if isinstance(event_dict["is_all_day"], str):
                            event_dict["is_all_day"] = event_dict[
                                "is_all_day"
                            ].lower() in ["true", "yes", "1"]
                        else:
                            event_dict["is_all_day"] = bool(event_dict["is_all_day"])

                    event = CalIntentOptions(**event_dict)
                except ValidationError as ve:
                    validation_errors.append(f"Event {idx + 1}: {str(ve)}")
                    logger.error(f"Validation error for calendar event dict: {ve}")
                    continue

                # Validate datetime formatting for non-all-day events
                if not event.is_all_day:
                    try:
                        # Validate ISO format for start and end times
                        datetime.fromisoformat(event.start.replace("Z", "+00:00"))
                        datetime.fromisoformat(event.end.replace("Z", "+00:00"))
                    except ValueError as ve:
                        validation_errors.append(
                            f"Event {idx + 1}: Invalid datetime format. Use ISO 8601 format (YYYY-MM-DDTHH:MM:SS±HH:MM)."
                        )
                        logger.error(f"Invalid datetime format: {ve}")
                        continue

                # Add the validated event
                calendar_options.append(event.model_dump())
            except Exception as e:
                validation_errors.append(f"Event {idx + 1}: {str(e)}")
                logger.error(f"Error processing calendar event: {e}")

        # Return validation errors if any
        if validation_errors and not calendar_options:
            return json.dumps(
                {
                    "error": "Calendar event validation failed",
                    "details": validation_errors,
                    "intent": "calendar",
                    "calendar_options": [],
                }
            )

        # Return the successfully processed events
        response = {"intent": "calendar", "calendar_options": calendar_options}

        # Include any validation warnings if some events had issues
        if validation_errors:
            response["warnings"] = validation_errors

        return json.dumps(response)

    except Exception as e:
        logger.error(f"Error processing calendar event: {e}")
        return json.dumps(
            {
                "error": "Unable to process calendar event",
                "details": str(e),
                "intent": "calendar",
                "calendar_options": [],
            }
        )


@tool
async def fetch_calendar_list(config: dict) -> str:
    """
    Retrieves the user's available calendars using their access token.

    This tool securely accesses the user's access token from the config metadata
    and calls the calendar service to fetch all available calendars.

    Use this tool when a user asks to:
    - View their calendar list
    - Choose a calendar for adding events
    - Verify which calendars are connected

    Args:
        config (dict): Runtime metadata passed from LangGraph. Includes `access_token`.

    Returns:
        str: JSON-formatted string containing the user's calendar list, or an error message.
    """
    try:
        access_token = config.get("configurable", {}).get("access_token")
        if not access_token:
            return json.dumps({"error": "Missing access token", "calendars": []})

        calendars = await list_calendars(access_token=access_token)
        if calendars is None:
            return json.dumps({"error": "Unable to fetch calendars", "calendars": []})

        return json.dumps({"calendars": calendars})

    except Exception as e:
        return json.dumps(
            {"error": f"Error fetching calendars: {str(e)}", "calendars": []}
        )
