from datetime import datetime, timezone
import json
from typing import Optional

from app.services.llm_service import LLMService
import httpx
from fastapi import HTTPException

from app.db.collections import calendar_collection
from app.models.calendar_models import EventCreateRequest
from app.utils.auth_utils import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_TOKEN_URL,
)
from app.utils.logging_util import get_logger

http_async_client = httpx.AsyncClient()


def filter_events(events: list) -> list:
    """
    Filters the provided events list as needed.

    For example, this function removes events that do not have a start time.
    You can modify this logic as required.

    Args:
        events (list): The list of events.

    Returns:
        list: The filtered list of events.
    """
    """Helper function to filter out unwanted events"""
    return [
        event
        for event in events
        if event.get("eventType") != "birthday"  # Exclude birthdays
        and "start" in event  # Ensure the event has a start time
        and ("dateTime" in event["start"] or "date" in event["start"])  # Valid date
    ]


async def fetch_calendar_events(
    calendar_id: str,
    access_token: str,
    page_token: Optional[str] = None,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
):
    """
    Fetches events for a specific calendar using the Google Calendar API.

    Args:
        calendar_id (str): The calendar identifier.
        access_token (str): The access token.
        page_token (str, optional): Pagination token.
        time_min (str, optional): ISO datetime string to filter events.
        time_max (str, optional): ISO datetime string to filter events.

    Returns:
        httpx.Response: The HTTP response from the Google Calendar API.
    """
    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"
    headers = {"Authorization": f"Bearer {access_token}"}

    if not time_min:
        time_min = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    params = {
        "maxResults": 50,
        "singleEvents": True,
        "orderBy": "startTime",
        "timeMin": time_min,
    }

    if time_max:
        params["timeMax"] = time_max
    if page_token:
        params["pageToken"] = page_token

    try:
        response = await http_async_client.get(url, headers=headers, params=params)
        if response.status_code != 200:
            error_detail = (
                response.json().get("error", {}).get("message", "Unknown error")
            )
            print(f"Google API Error: {error_detail}")
            raise HTTPException(status_code=response.status_code, detail=error_detail)
        return response
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"HTTP request failed: {e}")


logger = get_logger("calendar_service", "app.log")

# Create a global asynchronous HTTP client for reuse.
http_async_client = httpx.AsyncClient()


async def refresh_access_token(refresh_token: str) -> dict:
    """
    Refreshes the Google OAuth2.0 access token with comprehensive error handling.

    Args:
        refresh_token (str): The refresh token.

    Returns:
        dict: A dictionary containing the new access token and expiration time.

    Raises:
        HTTPException: If the refresh request fails or returns an error status.
    """
    try:
        response = await http_async_client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        token_data = response.json()
        return {
            "access_token": token_data.get("access_token"),
            "expires_in": token_data.get("expires_in", 3600),
        }
    except httpx.RequestError as e:
        logger.error(f"Token refresh request error: {e}")
        raise HTTPException(status_code=500, detail="Token refresh failed")
    except httpx.HTTPStatusError as e:
        logger.error(f"Token refresh HTTP error: {e.response.text}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")


async def fetch_calendar_list(access_token: str) -> httpx.Response:
    """
    Fetches the list of calendars for the authenticated user.

    Args:
        access_token (str): The access token.

    Returns:
        httpx.Response: The HTTP response from the Google Calendar API.
    """
    url = "https://www.googleapis.com/calendar/v3/users/me/calendarList"
    headers = {"Authorization": f"Bearer {access_token}"}
    response = await http_async_client.get(url, headers=headers)
    return response


async def get_calendar_events(
    access_token: str,
    refresh_token: str,
    user_id: str,
    page_token: str = None,
    selected_calendars: list = None,
    time_min: str = None,
    time_max: str = None,
) -> dict:
    """
    Fetches events from selected calendars, handling token refresh and pagination.

    This function first fetches the calendar list, updates the user's selected
    calendar preferences (if provided), and then iterates through the selected
    calendars to retrieve events. It applies filtering to the events via
    `filter_events`.

    Args:
        access_token (str): The current access token.
        refresh_token (str): The refresh token.
        user_id (str): The user's identifier.
        page_token (str, optional): The token for pagination.
        selected_calendars (list, optional): List of calendar IDs selected by the user.
        time_min (str, optional): ISO datetime string; if not provided, defaults to now.
        time_max (str, optional): ISO datetime string for filtering events.

    Returns:
        dict: Contains keys "events", "nextPageToken", and "selectedCalendars".

    Raises:
        HTTPException: If the calendar list cannot be fetched or token refresh fails.
    """
    # Set time_min to the current UTC datetime if not provided.
    if not time_min:
        time_min = datetime.now(timezone.utc).isoformat()

    calendar_list_response = await fetch_calendar_list(access_token)
    if calendar_list_response.status_code == 200:
        calendar_data = calendar_list_response.json()
        calendars = calendar_data.get("items", [])

        # Update or retrieve the user's selected calendars.
        if selected_calendars:
            await calendar_collection.update_one(
                {"user_id": user_id},
                {"$set": {"selected_calendars": selected_calendars}},
                upsert=True,
            )
        else:
            preferences = await calendar_collection.find_one({"user_id": user_id})
            if preferences and preferences.get("selected_calendars"):
                selected_calendars = preferences["selected_calendars"]
            else:
                primary_calendar = next(
                    (cal for cal in calendars if cal.get("primary")), None
                )
                if primary_calendar:
                    selected_calendars = [primary_calendar["id"]]
                    await calendar_collection.update_one(
                        {"user_id": user_id},
                        {"$set": {"selected_calendars": selected_calendars}},
                        upsert=True,
                    )
                else:
                    selected_calendars = []

        # Filter calendars based on selected IDs.
        calendars = [cal for cal in calendars if cal.get("id") in selected_calendars]

        all_events = []
        next_page_token = None

        # Fetch events from each selected calendar.
        for cal in calendars:
            cal_id = cal.get("id")
            events_response = await fetch_calendar_events(
                cal_id, access_token, page_token, time_min, time_max
            )
            if events_response.status_code == 200:
                events_data = events_response.json()
                events = events_data.get("items", [])
                # Add calendar info to each event.
                for event in events:
                    event["calendarId"] = cal_id
                    event["calendarTitle"] = cal.get("summary", "")
                filtered_events = filter_events(events)
                all_events.extend(filtered_events)
                if events_data.get("nextPageToken"):
                    next_page_token = events_data["nextPageToken"]

        return {
            "events": all_events,
            "nextPageToken": next_page_token,
            "selectedCalendars": selected_calendars,
        }
    elif calendar_list_response.status_code == 401 and refresh_token:
        tokens = await refresh_access_token(refresh_token)
        new_access_token = tokens.get("access_token")
        return await get_calendar_events(
            new_access_token,
            refresh_token,
            user_id,
            page_token,
            selected_calendars,
            time_min,
            time_max,
        )
    else:
        raise HTTPException(
            status_code=calendar_list_response.status_code,
            detail="Failed to fetch calendar list",
        )


async def get_calendar_events_by_id(
    calendar_id: str,
    access_token: str,
    refresh_token: str = None,
    page_token: str = None,
    time_min: str = None,
    time_max: str = None,
) -> dict:
    """
    Fetches events from a specific calendar identified by `calendar_id`.

    Args:
        calendar_id (str): The calendar identifier.
        access_token (str): The access token.
        refresh_token (str, optional): The refresh token.
        page_token (str, optional): Token for pagination.
        time_min (str, optional): ISO datetime string for filtering events.
        time_max (str, optional): ISO datetime string for filtering events.

    Returns:
        dict: Contains keys "events" and "nextPageToken".

    Raises:
        HTTPException: If fetching events fails or token refresh is required and fails.
    """
    if not time_min:
        time_min = datetime.now(timezone.utc).isoformat()

    events_response = await fetch_calendar_events(
        calendar_id, access_token, page_token, time_min, time_max
    )

    if events_response.status_code == 200:
        events_data = events_response.json()
        events = filter_events(events_data.get("items", []))
        return {
            "events": events,
            "nextPageToken": events_data.get("nextPageToken"),
        }
    elif events_response.status_code == 401 and refresh_token:
        tokens = await refresh_access_token(refresh_token)
        new_access_token = tokens.get("access_token")
        return await get_calendar_events_by_id(
            calendar_id, new_access_token, refresh_token, page_token, time_min, time_max
        )
    elif events_response.status_code == 400:
        raise HTTPException(status_code=400, detail="Invalid request parameters.")
    else:
        error_detail = (
            events_response.json().get("error", {}).get("message", "Unknown error")
        )
        raise HTTPException(
            status_code=events_response.status_code, detail=error_detail
        )


async def create_calendar_event(
    event: EventCreateRequest,
    access_token: str,
    refresh_token: str = None,
) -> dict:
    """
    Creates a new calendar event on the primary calendar.

    Args:
        event (EventCreateRequest): The event details.
        access_token (str): The current access token.
        refresh_token (str, optional): The refresh token.

    Returns:
        dict: The created event details.

    Raises:
        HTTPException: If the event creation fails.
    """
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    event_payload = {
        "summary": event.summary,
        "description": event.description,
        "start": event.start.dict(),
        "end": event.end.dict(),
    }
    response = await http_async_client.post(url, headers=headers, json=event_payload)
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 401:
        if refresh_token:
            # You may choose to implement token refresh logic here.
            raise HTTPException(
                status_code=401,
                detail="Token expired. Please refresh and try again.",
            )
        raise HTTPException(status_code=401, detail="Invalid access token")
    else:
        error_detail = response.json().get("error", {}).get("message", "Unknown error")
        raise HTTPException(status_code=response.status_code, detail=error_detail)
