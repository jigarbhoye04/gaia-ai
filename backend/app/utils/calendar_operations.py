"""
Comprehensive calendar operations utilities for robust event management.
This module provides centralized functions for calendar operations with
proper error handling, validation, and timezone management.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import httpx
from fastapi import HTTPException

from app.config.loggers import calendar_logger as logger
from app.models.calendar_models import EventCreateRequest
from app.utils.calendar_utils import resolve_timezone


class CalendarOperationError(Exception):
    """Custom exception for calendar operations"""

    pass


class CalendarValidationError(CalendarOperationError):
    """Exception for calendar data validation errors"""

    pass


class CalendarNetworkError(CalendarOperationError):
    """Exception for network-related calendar errors"""

    pass


async def validate_event_data(event: EventCreateRequest) -> None:
    """
    Validate calendar event data based on event type.

    Args:
        event: The event data to validate

    Raises:
        CalendarValidationError: If validation fails
    """
    try:
        # Basic field validation
        if not event.summary or not event.summary.strip():
            raise CalendarValidationError("Event summary is required")

        # Validate timezone
        if event.timezone:
            try:
                resolve_timezone(event.timezone)
            except Exception:
                raise CalendarValidationError(f"Invalid timezone: {event.timezone}")

        # Type-specific validation
        if event.is_all_day:
            # For all-day events, validate date format if provided
            if event.start:
                _validate_date_string(event.start, "start date")
            if event.end:
                _validate_date_string(event.end, "end date")
                # Ensure end date is after start date
                if event.start and event.end:
                    start_date = _parse_date_string(event.start)
                    end_date = _parse_date_string(event.end)
                    if end_date <= start_date:
                        raise CalendarValidationError(
                            "End date must be after start date"
                        )
        else:
            # For timed events, both start and end are required
            if not event.start or not event.end:
                raise CalendarValidationError(
                    "Start and end times are required for timed events"
                )

            # Validate datetime format and order
            try:
                start_dt = datetime.fromisoformat(event.start.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(event.end.replace("Z", "+00:00"))

                if end_dt <= start_dt:
                    raise CalendarValidationError("End time must be after start time")

            except ValueError as e:
                raise CalendarValidationError(f"Invalid datetime format: {e}")

        logger.info(f"Event validation successful for: {event.summary}")

    except CalendarValidationError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during event validation: {e}")
        raise CalendarValidationError(f"Event validation failed: {e}")


def _validate_date_string(date_str: str, field_name: str) -> None:
    """Validate date string format"""
    try:
        if "T" in date_str:
            # Extract date part from datetime string
            date_str = date_str.split("T")[0]
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise CalendarValidationError(
            f"Invalid {field_name} format. Expected YYYY-MM-DD"
        )


def _parse_date_string(date_str: str) -> datetime:
    """Parse date string to datetime object"""
    if "T" in date_str:
        date_str = date_str.split("T")[0]
    return datetime.strptime(date_str, "%Y-%m-%d")


async def create_event_payload(event: EventCreateRequest) -> Dict[str, Any]:
    """
    Create a properly formatted event payload for Google Calendar API.

    Args:
        event: The event creation request

    Returns:
        Dict containing the formatted event payload

    Raises:
        CalendarValidationError: If event data is invalid
    """
    try:
        await validate_event_data(event)

        payload: Dict[str, Any] = {
            "summary": event.summary.strip(),
            "description": event.description.strip() if event.description else "",
        }

        if event.is_all_day:
            # Handle all-day events
            start_date, end_date = _prepare_all_day_dates(event)
            payload["start"] = {"date": start_date}
            payload["end"] = {"date": end_date}

            logger.info(f"Created all-day event payload: {start_date} to {end_date}")
        else:
            # Handle timed events
            start_dt, end_dt, tz_name = _prepare_timed_event(event)
            payload["start"] = {
                "dateTime": start_dt.isoformat(),
                "timeZone": tz_name,
            }
            payload["end"] = {
                "dateTime": end_dt.isoformat(),
                "timeZone": tz_name,
            }

            logger.info(
                f"Created timed event payload: {start_dt} to {end_dt} ({tz_name})"
            )

        return payload

    except CalendarValidationError:
        raise
    except Exception as e:
        logger.error(f"Error creating event payload: {e}")
        raise CalendarValidationError(f"Failed to create event payload: {e}")


def _prepare_all_day_dates(event: EventCreateRequest) -> tuple[str, str]:
    """Prepare start and end dates for all-day events"""
    if event.start and event.end:
        # Use provided dates
        start_date = event.start.split("T")[0] if "T" in event.start else event.start
        end_date = event.end.split("T")[0] if "T" in event.end else event.end
    elif event.start:
        # Only start date provided, end date is next day
        start_date = event.start.split("T")[0] if "T" in event.start else event.start
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_date = (start_dt + timedelta(days=1)).strftime("%Y-%m-%d")
    else:
        # No dates provided, default to today and tomorrow
        today = datetime.now()
        start_date = today.strftime("%Y-%m-%d")
        end_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")

    return start_date, end_date


def _prepare_timed_event(event: EventCreateRequest) -> tuple[datetime, datetime, str]:
    """Prepare datetime objects for timed events"""
    try:
        canonical_timezone = resolve_timezone(event.timezone or "UTC")
        user_tz = ZoneInfo(canonical_timezone)

        # Ensure start and end are not None
        if not event.start or not event.end:
            raise CalendarValidationError(
                "Start and end times are required for timed events"
            )

        # Parse datetime strings and apply timezone
        start_dt = datetime.fromisoformat(event.start.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(event.end.replace("Z", "+00:00"))

        # Convert to user timezone if needed
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=user_tz)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=user_tz)

        return start_dt, end_dt, canonical_timezone

    except Exception as e:
        raise CalendarValidationError(f"Invalid timezone or datetime format: {e}")


async def make_calendar_request(
    method: str,
    url: str,
    headers: Dict[str, str],
    data: Optional[Dict[str, Any]] = None,
    timeout: int = 30,
) -> Dict[str, Any]:
    """
    Make a robust HTTP request to Google Calendar API with error handling.

    Args:
        method: HTTP method (GET, POST, etc.)
        url: Request URL
        headers: Request headers
        data: Request payload (for POST/PUT)
        timeout: Request timeout in seconds

    Returns:
        Response data as dictionary

    Raises:
        CalendarNetworkError: For network-related errors
        HTTPException: For API errors
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            if method.upper() == "GET":
                response = await client.get(url, headers=headers)
            elif method.upper() == "POST":
                response = await client.post(url, headers=headers, json=data)
            elif method.upper() == "PUT":
                response = await client.put(url, headers=headers, json=data)
            elif method.upper() == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise CalendarNetworkError(f"Unsupported HTTP method: {method}")

            # Handle response
            if response.status_code in (200, 201):
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Authentication failed")
            elif response.status_code == 403:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            elif response.status_code == 404:
                raise HTTPException(status_code=404, detail="Resource not found")
            else:
                error_detail = "Unknown error"
                try:
                    error_json = response.json()
                    if isinstance(error_json, dict):
                        error_detail = error_json.get("error", {}).get(
                            "message", "Unknown error"
                        )
                except Exception:
                    error_detail = response.text or "Unknown error"

                raise HTTPException(
                    status_code=response.status_code, detail=error_detail
                )

    except httpx.TimeoutException:
        raise CalendarNetworkError("Request timeout")
    except httpx.RequestError as e:
        raise CalendarNetworkError(f"Network error: {e}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in calendar request: {e}")
        raise CalendarNetworkError(f"Request failed: {e}")


class CalendarOperations:
    """
    Centralized class for calendar operations with robust error handling
    and best practices.
    """

    def __init__(self, access_token: str, refresh_token: Optional[str] = None):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.base_url = "https://www.googleapis.com/calendar/v3"

    @property
    def headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    async def create_event(
        self, event: EventCreateRequest, calendar_id: str = "primary"
    ) -> Dict[str, Any]:
        """
        Create a calendar event with robust error handling.

        Args:
            event: Event creation request
            calendar_id: Target calendar ID

        Returns:
            Created event data
        """
        try:
            # Validate and prepare event payload
            payload = await create_event_payload(event)

            # Make API request
            url = f"{self.base_url}/calendars/{calendar_id}/events"

            result = await make_calendar_request(
                method="POST", url=url, headers=self.headers, data=payload
            )

            logger.info(f"Successfully created event: {event.summary}")
            return result

        except (CalendarValidationError, CalendarNetworkError, HTTPException):
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating event: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create event: {e}")

    async def get_events(
        self,
        calendar_id: str = "primary",
        time_min: Optional[str] = None,
        time_max: Optional[str] = None,
        max_results: int = 50,
    ) -> Dict[str, Any]:
        """
        Fetch calendar events with error handling.

        Args:
            calendar_id: Calendar to fetch from
            time_min: Start time filter
            time_max: End time filter
            max_results: Maximum events to return

        Returns:
            Events data
        """
        try:
            if not time_min:
                time_min = datetime.now(timezone.utc).isoformat()

            url = f"{self.base_url}/calendars/{calendar_id}/events"
            params = {
                "maxResults": max_results,
                "singleEvents": True,
                "orderBy": "startTime",
                "timeMin": time_min,
            }
            if time_max:
                params["timeMax"] = time_max

            # Add query parameters to URL
            query_string = "&".join([f"{k}={v}" for k, v in params.items()])
            full_url = f"{url}?{query_string}"

            result = await make_calendar_request(
                method="GET", url=full_url, headers=self.headers
            )

            logger.info(f"Successfully fetched {len(result.get('items', []))} events")
            return result

        except (CalendarNetworkError, HTTPException):
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching events: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch events: {e}")

    async def list_calendars(self, short: bool = False) -> List[Dict[str, Any]]:
        """
        List user's calendars with error handling.

        Args:
            short: Return only essential fields

        Returns:
            List of calendar data
        """
        try:
            url = f"{self.base_url}/users/me/calendarList"

            result = await make_calendar_request(
                method="GET", url=url, headers=self.headers
            )

            calendars = result.get("items", [])

            if short:
                calendars = [
                    {
                        "id": cal.get("id"),
                        "summary": cal.get("summary"),
                        "description": cal.get("description"),
                        "backgroundColor": cal.get("backgroundColor"),
                    }
                    for cal in calendars
                ]

            logger.info(f"Successfully fetched {len(calendars)} calendars")
            return calendars

        except (CalendarNetworkError, HTTPException):
            raise
        except Exception as e:
            logger.error(f"Unexpected error listing calendars: {e}")
            raise HTTPException(
                status_code=500, detail=f"Failed to list calendars: {e}"
            )
