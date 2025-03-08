import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import httpx
from fastapi import HTTPException

from app.config.loggers import calendar_logger as logger
from app.db.collections import calendars_collection
from app.models.calendar_models import EventCreateRequest
from app.config.settings import settings
from app.utils.calendar_utils import resolve_timezone

http_async_client = httpx.AsyncClient()


async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    """
    Refresh the Google OAuth2.0 access token using the provided refresh token.

    Args:
        refresh_token (str): The refresh token.

    Returns:
        dict: Contains the new access token and expiration details.

    Raises:
        HTTPException: If the refresh request fails.
    """
    try:
        response = await http_async_client.post(
            settings.GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        token_data = response.json()
        return token_data
    except httpx.RequestError as e:
        logger.error(f"Token refresh request error: {e}")
        raise HTTPException(status_code=500, detail="Token refresh failed")
    except httpx.HTTPStatusError as e:
        logger.error(f"Token refresh HTTP error: {e.response.text}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")


async def fetch_calendar_list(access_token: str) -> Dict[str, Any]:
    """
    Fetch the list of calendars for the authenticated user.

    Args:
        access_token (str): The access token.

    Returns:
        dict: The calendar list data.

    Raises:
        HTTPException: If the request fails.
    """
    url = "https://www.googleapis.com/calendar/v3/users/me/calendarList"
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        response = await http_async_client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        try:
            error_detail = (
                exc.response.json().get("error", {}).get("message", "Unknown error")
            )
        except Exception:
            error_detail = "Unknown error"
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Error fetching list of calendars: {error_detail}",
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while requesting the calendar list: {exc}",
        )


def filter_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Filter out unwanted events from the provided list.

    Args:
        events (list): List of events.

    Returns:
        list: Filtered events excluding birthdays and events missing a valid start time.
    """
    return [
        event
        for event in events
        if event.get("eventType") != "birthday"
        and "start" in event
        and ("dateTime" in event["start"] or "date" in event["start"])
    ]


async def fetch_calendar_events(
    calendar_id: str,
    access_token: str,
    page_token: Optional[str] = None,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch events for a specific calendar.

    Args:
        calendar_id (str): Calendar identifier.
        access_token (str): Access token.
        page_token (Optional[str]): Pagination token.
        time_min (Optional[str]): Start time filter.
        time_max (Optional[str]): End time filter.

    Returns:
        dict: The events data.
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
        if response.status_code == 200:
            return response.json()
        else:
            error_detail = (
                response.json().get("error", {}).get("message", "Unknown error")
            )
            raise HTTPException(status_code=response.status_code, detail=error_detail)
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"HTTP request failed: {e}")


async def list_calendars(
    access_token: str, refresh_token: Optional[str] = None
) -> Dict[str, Any]:
    """
    Retrieve the user's calendar list. If the access token is invalid and a refresh token is provided,
    the token is refreshed automatically.

    Args:
        access_token (str): Current access token.
        refresh_token (Optional[str]): Refresh token.

    Returns:
        dict: Calendar list data.
    """
    try:
        return await fetch_calendar_list(access_token)
    except HTTPException as e:
        if e.status_code == 401 and refresh_token:
            token_data = await refresh_access_token(refresh_token)
            new_access_token = token_data.get("access_token")
            return await fetch_calendar_list(new_access_token)
        raise e


async def get_calendar_events(
    user_id: str,
    access_token: str,
    refresh_token: Optional[str] = None,
    page_token: Optional[str] = None,
    selected_calendars: Optional[List[str]] = None,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get events from the user's selected calendars with pagination and preferences.

    Args:
        user_id (str): User identifier.
        access_token (str): Access token.
        refresh_token (Optional[str]): Refresh token.
        page_token (Optional[str]): Pagination token.
        selected_calendars (Optional[List[str]]): List of selected calendar IDs.
        time_min (Optional[str]): Start time filter.
        time_max (Optional[str]): End time filter.

    Returns:
        dict: A dictionary containing events, nextPageToken, and the selected calendar IDs.
    """
    if not time_min:
        time_min = datetime.now(timezone.utc).isoformat()

    # Fetch the calendar list and handle token refresh once if needed.
    try:
        calendar_data = await fetch_calendar_list(access_token)
    except HTTPException as e:
        if e.status_code == 401 and refresh_token:
            token_data = await refresh_access_token(refresh_token)
            new_access_token = token_data.get("access_token")
            calendar_data = await fetch_calendar_list(new_access_token)
            access_token = new_access_token
        else:
            raise e

    calendars = calendar_data.get("items", [])

    # Determine selected calendars: update preferences if provided,
    # otherwise load from the database or default to the primary calendar.
    if selected_calendars:
        await calendars_collection.update_one(
            {"user_id": user_id},
            {"$set": {"selected_calendars": selected_calendars}},
            upsert=True,
        )
    else:
        preferences = await calendars_collection.find_one({"user_id": user_id})
        if preferences and preferences.get("selected_calendars"):
            selected_calendars = preferences["selected_calendars"]
        else:
            primary_calendar = next(
                (cal for cal in calendars if cal.get("primary")), None
            )
            selected_calendars = [primary_calendar["id"]] if primary_calendar else []
            await calendars_collection.update_one(
                {"user_id": user_id},
                {"$set": {"selected_calendars": selected_calendars}},
                upsert=True,
            )

    # Filter the calendars to only those that are selected.
    selected_cal_objs = [cal for cal in calendars if cal["id"] in selected_calendars]

    # Create tasks for fetching events concurrently.
    tasks = [
        fetch_calendar_events(cal["id"], access_token, page_token, time_min, time_max)
        for cal in selected_cal_objs
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_events = []
    next_page_token = None

    # Process results from all tasks.
    for cal, result in zip(selected_cal_objs, results):
        if isinstance(result, Exception):
            # Optionally log the error for this calendar
            logger.error(f"Error fetching events for calendar {cal['id']}: {result}")
            continue
        events = result.get("items", [])
        for event in events:
            event["calendarId"] = cal["id"]
            event["calendarTitle"] = cal.get("summary", "")
        all_events.extend(filter_events(events))
        # Use the first encountered nextPageToken (or handle it as needed)
        if result.get("nextPageToken") and not next_page_token:
            next_page_token = result["nextPageToken"]

    # Optionally sort events here if needed.
    all_events.sort(
        key=lambda e: datetime.fromisoformat(
            e["start"].get("dateTime", e["start"].get("date", ""))
            or "1970-01-01T00:00:00"
        )
    )

    return {
        "events": all_events,
        "nextPageToken": next_page_token,
        "selectedCalendars": selected_calendars,
    }


async def get_calendar_events_by_id(
    calendar_id: str,
    access_token: str,
    refresh_token: Optional[str] = None,
    page_token: Optional[str] = None,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch events for a specific calendar by its ID.

    Args:
        calendar_id (str): The calendar identifier.
        access_token (str): The access token.
        refresh_token (Optional[str]): Refresh token.
        page_token (Optional[str]): Pagination token.
        time_min (Optional[str]): Start time filter.
        time_max (Optional[str]): End time filter.

    Returns:
        dict: A dictionary containing the events and a nextPageToken if available.
    """
    if not time_min:
        time_min = datetime.now(timezone.utc).isoformat()

    try:
        events_data = await fetch_calendar_events(
            calendar_id, access_token, page_token, time_min, time_max
        )
    except HTTPException as e:
        if e.status_code == 401 and refresh_token:
            token_data = await refresh_access_token(refresh_token)
            new_access_token = token_data.get("access_token")
            events_data = await fetch_calendar_events(
                calendar_id, new_access_token, page_token, time_min, time_max
            )
        else:
            raise e

    events = filter_events(events_data.get("items", []))
    return {
        "events": events,
        "nextPageToken": events_data.get("nextPageToken"),
    }


async def create_calendar_event(
    event: EventCreateRequest,
    access_token: str,
    refresh_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a new calendar event using the Google Calendar API.
    The function normalizes the provided timezone and ensures the event datetimes are timezone-aware.

    Args:
        event (EventCreateRequest): The event details.
        access_token (str): The access token.
        refresh_token (Optional[str]): Refresh token.

    Returns:
        dict: The newly created event details.

    Raises:
        HTTPException: If event creation fails.
    """
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    try:
        canonical_timezone = resolve_timezone(event.timezone)
        user_tz = ZoneInfo(canonical_timezone)
        start_dt = event.start.replace(tzinfo=user_tz).astimezone(user_tz)
        end_dt = event.end.replace(tzinfo=user_tz).astimezone(user_tz)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid timezone: {str(e)}")

    event_payload = {
        "summary": event.summary,
        "description": event.description,
        "start": {
            "dateTime": start_dt.isoformat(),
            "timeZone": canonical_timezone,
        },
        "end": {
            "dateTime": end_dt.isoformat(),
            "timeZone": canonical_timezone,
        },
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=event_payload)
    if response.status_code in (200, 201):
        return response.json()
    elif response.status_code == 403:
        raise HTTPException(
            status_code=403,
            detail="Insufficient authentication scopes. Please ensure your token includes the required scopes.",
        )
    elif response.status_code == 401:
        if refresh_token:
            raise HTTPException(
                status_code=401,
                detail="Token expired. Please refresh and try again.",
            )
        raise HTTPException(status_code=401, detail="Invalid access token")
    else:
        error_detail = response.json().get("error", {}).get("message", "Unknown error")
        raise HTTPException(status_code=response.status_code, detail=error_detail)


async def get_all_calendar_events(
    access_token: str,
    refresh_token: Optional[str] = None,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch events from all calendars associated with the user concurrently.

    Args:
        access_token (str): Access token.
        refresh_token (Optional[str]): Refresh token.
        time_min (Optional[str]): Start time filter.
        time_max (Optional[str]): End time filter.

    Returns:
        dict: A mapping of calendar IDs to their respective events.
    """
    try:
        calendar_list_data = await fetch_calendar_list(access_token)
        valid_token = access_token
    except HTTPException as e:
        if e.status_code == 401 and refresh_token:
            token_data = await refresh_access_token(refresh_token)
            valid_token = token_data.get("access_token")
            calendar_list_data = await fetch_calendar_list(valid_token)
        else:
            raise e

    calendars = calendar_list_data.get("items", [])
    if not calendars:
        return {"calendars": {}}
    if not time_min:
        time_min = datetime.now(timezone.utc).isoformat()

    tasks = {
        cal["id"]: get_calendar_events_by_id(
            calendar_id=cal["id"],
            access_token=valid_token,
            refresh_token=refresh_token,
            time_min=time_min,
            time_max=time_max,
        )
        for cal in calendars
        if "id" in cal
    }
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    events_by_calendar = {}
    for cal_id, result in zip(tasks.keys(), results):
        if isinstance(result, Exception):
            events_by_calendar[cal_id] = {"error": str(result)}
        else:
            events_by_calendar[cal_id] = result
    return {"calendars": events_by_calendar}
