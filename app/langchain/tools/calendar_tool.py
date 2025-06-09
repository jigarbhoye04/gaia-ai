import json
import pprint
from typing import Any, Dict, List, Union

from langchain_core.runnables.config import RunnableConfig
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from app.models.calendar_models import EventCreateRequest

from app.config.loggers import chat_logger as logger
from app.docstrings.langchain.tools.calendar_tool_docs import (
    CALENDAR_EVENT,
    FETCH_CALENDAR_LIST,
)
from app.docstrings.utils import with_doc
from app.services.calendar_service import list_calendars
from app.langchain.templates.calendar_template import (
    CALENDAR_PROMPT_TEMPLATE,
    CALENDAR_LIST_TEMPLATE,
)


@tool(parse_docstring=True)
@with_doc(CALENDAR_EVENT)
async def calendar_event(
    event_data: Union[List[Union[EventCreateRequest, Dict[str, Any]]], EventCreateRequest, Dict[str, Any]],
    config: RunnableConfig,
) -> str:
    try:
        logger.info("===== CALENDAR EVENT TOOL CALLED =====")
        logger.info("Processing calendar event with data:")
        logger.info(pprint.pformat(event_data, indent=2, width=100))

        # Normalize input to always work with a list of EventCreateRequest objects
        event_list: List[EventCreateRequest] = []
        
        if isinstance(event_data, EventCreateRequest):
            # Single event object - convert to list
            event_list = [event_data]
            logger.info("Received single event object, converting to list")
        elif isinstance(event_data, list):
            # Process list - ensure all items are EventCreateRequest objects
            for item in event_data:
                if isinstance(item, EventCreateRequest):
                    event_list.append(item)
                elif isinstance(item, dict):
                    # Convert dict to EventCreateRequest
                    try:
                        event_obj = EventCreateRequest(**item)
                        event_list.append(event_obj)
                    except Exception as e:
                        logger.error(f"Failed to convert dict to EventCreateRequest: {e}")
                        continue
                else:
                    logger.error(f"Invalid item type in list: {type(item)}")
                    continue
            logger.info(f"Processed list with {len(event_list)} valid events")
        elif isinstance(event_data, dict):
            # Single dict - convert to EventCreateRequest
            try:
                event_obj = EventCreateRequest(**event_data)
                event_list = [event_obj]
                logger.info("Converted single dict to EventCreateRequest")
            except Exception as e:
                logger.error(f"Failed to convert dict to EventCreateRequest: {e}")
                return json.dumps(
                    {
                        "error": f"Invalid event data format: {e}",
                        "intent": "calendar",
                        "calendar_options": [],
                        "prompt": str(CALENDAR_PROMPT_TEMPLATE.invoke({})),
                    }
                )
        else:
            # Invalid type
            logger.error(f"Invalid event data type: {type(event_data)}")
            return json.dumps(
                {
                    "error": "Calendar event data must be an EventCreateRequest object, dict, or list of such objects",
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
                
                # Add the validated event as a proper dict with all required fields
                event_dict = {
                    "summary": event.summary,
                    "description": event.description or "",
                    "is_all_day": event.is_all_day,
                    "timezone": event.timezone or "UTC",
                }
                
                # Add optional fields only if they exist
                if event.start:
                    event_dict["start"] = event.start
                if event.end:
                    event_dict["end"] = event.end
                if event.calendar_id:
                    event_dict["calendar_id"] = event.calendar_id
                if event.calendar_name:
                    event_dict["calendar_name"] = event.calendar_name
                if event.calendar_color:
                    event_dict["calendar_color"] = event.calendar_color
                
                calendar_options.append(event_dict)
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
@with_doc(FETCH_CALENDAR_LIST)
async def fetch_calendar_list(
    config: RunnableConfig,
) -> str | dict:
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
