import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union, cast
from zoneinfo import ZoneInfo

import httpx
from fastapi import HTTPException

from app.api.v1.dependencies.oauth_dependencies import refresh_access_token
from app.config.loggers import calendar_logger as logger
from app.db.mongodb.collections import calendars_collection
from app.models.calendar_models import (
    EventCreateRequest,
    EventDeleteRequest,
    EventUpdateRequest,
)
from app.utils.calendar_utils import resolve_timezone

http_async_client = httpx.AsyncClient()


# async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
#     """
#     Refresh the Google OAuth2.0 access token using the provided refresh token.

#     Args:
#         refresh_token (str): The refresh token.

#     Returns:
#         dict: Contains the new access token and expiration details.

#     Raises:
#         HTTPException: If the refresh request fails.
#     """
#     try:
#         response = await http_async_client.post(
#             settings.GOOGLE_TOKEN_URL,
#             data={
#                 "client_id": settings.GOOGLE_CLIENT_ID,
#                 "client_secret": settings.GOOGLE_CLIENT_SECRET,
#                 "refresh_token": refresh_token,
#                 "grant_type": "refresh_token",
#             },
#         )
#         response.raise_for_status()
#         token_data = response.json()
#         return token_data
#     except httpx.RequestError as e:
#         logger.error(f"Token refresh request error: {e}")
#         raise HTTPException(status_code=500, detail="Token refresh failed")
#     except httpx.HTTPStatusError as e:
#         logger.error(f"Token refresh HTTP error: {e.response.text}")
#         raise HTTPException(status_code=401, detail="Invalid refresh token")


async def fetch_calendar_list(access_token: str, short: bool = False) -> Any:
    """
    Fetch the list of calendars for the authenticated user.

    Args:
        access_token (str): The access token.
        short (bool): If True, returns only key fields per calendar.

    Returns:
        Any: Full or filtered calendar data.
    """
    url = "https://www.googleapis.com/calendar/v3/users/me/calendarList"
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        response = await httpx.AsyncClient().get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        if short:
            return [
                {
                    "id": c.get("id"),
                    "summary": c.get("summary"),
                    "description": c.get("description"),
                    "backgroundColor": c.get("backgroundColor"),
                }
                for c in data.get("items", [])
            ]

        return data

    except httpx.HTTPStatusError as exc:
        error_detail = "Unknown error"
        error_json = exc.response.json()
        if isinstance(error_json, dict):
            error_message = error_json.get("error", {})
            if isinstance(error_message, dict):
                error_detail = error_message.get("message", "Unknown error")

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
    params: Dict[str, Union[str, int, bool]] = {
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
    access_token: str, refresh_token: Optional[str] = None, short=False
) -> Optional[Dict[str, Any]]:
    """
    Retrieve the user's calendar list. If the access token is invalid and a refresh token is provided,
    the token is refreshed automatically.

    Args:
        access_token (str): Current access token.
        refresh_token (Optional[str]): Refresh token.
        short (bool): If True, returns only key fields per calendar.

    Returns:
        Optional[Dict[str, Any]]: Calendar list data or None if retrieval fails.
    """
    try:
        return await fetch_calendar_list(access_token, short)
    except HTTPException as e:
        if e.status_code == 401 and refresh_token:
            token_data = await refresh_access_token(refresh_token)
            new_access_token = token_data.get("access_token")
            if new_access_token:
                return await fetch_calendar_list(new_access_token)
            return None
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
            if new_access_token:
                calendar_data = await fetch_calendar_list(new_access_token)
            else:
                raise e
            access_token = new_access_token
        else:
            raise e

    calendars = calendar_data.get("items", [])

    # Determine selected calendars: update preferences if provided,
    # otherwise load from the database or default to the primary calendar.
    user_selected_calendars: List[str] = []
    if selected_calendars is not None:
        user_selected_calendars = selected_calendars
        await calendars_collection.update_one(
            {"user_id": user_id},
            {"$set": {"selected_calendars": user_selected_calendars}},
            upsert=True,
        )
    else:
        preferences = await calendars_collection.find_one({"user_id": user_id})
        if preferences and preferences.get("selected_calendars"):
            user_selected_calendars = preferences["selected_calendars"]
        else:
            primary_calendar = next(
                (cal for cal in calendars if cal.get("primary")), None
            )
            if primary_calendar:
                user_selected_calendars = [primary_calendar["id"]]
            await calendars_collection.update_one(
                {"user_id": user_id},
                {"$set": {"selected_calendars": user_selected_calendars}},
                upsert=True,
            )

    # Filter the calendars to only those that are selected.
    selected_cal_objs = [
        cal for cal in calendars if cal["id"] in user_selected_calendars
    ]

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
            logger.error(f"Error fetching events for calendar {cal['id']}: {result}")
            continue

        # Cast result to a dictionary explicitly
        result_dict = cast(Dict[str, Any], result)

        events = result_dict.get("items", [])
        for event in events:
            event["calendarId"] = cal["id"]
            event["calendarTitle"] = cal.get("summary", "")
        all_events.extend(filter_events(events))

        # Use the first encountered nextPageToken (or handle it as needed)
        if not next_page_token and result_dict.get("nextPageToken"):
            next_page_token = result_dict["nextPageToken"]

    return {
        "events": all_events,
        "nextPageToken": next_page_token,
        "selectedCalendars": user_selected_calendars,
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
            if new_access_token:
                events_data = await fetch_calendar_events(
                    calendar_id, new_access_token, page_token, time_min, time_max
                )
            else:
                raise e
        else:
            raise e

    events = filter_events(events_data.get("items", []))
    return {
        "events": events,
        "nextPageToken": events_data.get("nextPageToken"),
    }


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
            if isinstance(token_data, dict):
                new_access_token = token_data.get("access_token")
                if new_access_token:
                    valid_token = new_access_token
                    calendar_list_data = await fetch_calendar_list(valid_token)
                else:
                    raise e
            else:
                raise e
        else:
            raise e

    calendars = calendar_list_data.get("items", [])
    if not calendars:
        return {"calendars": {}}
    if not time_min:
        time_min = datetime.now(timezone.utc).isoformat()

    tasks = {
        cal["id"]: asyncio.create_task(
            get_calendar_events_by_id(
                calendar_id=cal["id"],
                access_token=valid_token,
                refresh_token=refresh_token,
                time_min=time_min,
                time_max=time_max,
            )
        )
        for cal in calendars
        if "id" in cal
    }

    events_by_calendar = {}
    for cal_id, task in tasks.items():
        try:
            result = await task
            events_by_calendar[cal_id] = result
        except Exception as e:
            events_by_calendar[cal_id] = {"error": str(e)}

    return {"calendars": events_by_calendar}


async def create_calendar_event(
    event: EventCreateRequest,
    access_token: str,
    refresh_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a new calendar event using the Google Calendar API.
    The function normalizes the provided timezone and ensures the event datetimes are timezone-aware.
    Supports full-day events and custom calendar selection.

    Args:
        event (EventCreateRequest): The event details.
        access_token (str): The access token.
        refresh_token (Optional[str]): Refresh token.

    Returns:
        dict: The newly created event details.

    Raises:
        HTTPException: If event creation fails.
    """
    # Determine which calendar to use (default to primary if not specified)
    calendar_id = event.calendar_id or "primary"
    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # Create the basic event payload
    event_payload: dict[str, str | dict] = {
        "summary": event.summary,
        "description": event.description,
    }

    # Handle different event types (all-day vs. time-specific)
    if event.is_all_day:
        # For all-day events, use date format without time component
        if event.start and event.end:
            # If start and end dates are provided, extract the date parts
            start_date = (
                event.start.split("T")[0] if "T" in event.start else event.start
            )
            end_date = event.end.split("T")[0] if "T" in event.end else event.end
        elif event.start:
            # If only start date is provided, end date is the next day

            start_date = (
                event.start.split("T")[0] if "T" in event.start else event.start
            )
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_date = (start_dt + timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            # If no dates provided, default to today for start and tomorrow for end
            today = datetime.now()
            start_date = today.strftime("%Y-%m-%d")
            end_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")

        event_payload["start"] = {"date": start_date}
        event_payload["end"] = {"date": end_date}
    else:
        # For time-specific events, use datetime with timezone
        try:
            # Both start and end times are required for time-specific events
            if not event.start or not event.end:
                raise HTTPException(
                    status_code=400,
                    detail="Start and end times are required for time-specific events",
                )

            canonical_timezone = resolve_timezone(event.timezone or "UTC")
            user_tz = ZoneInfo(canonical_timezone)

            # Parse the ISO string into a datetime
            start_dt = datetime.fromisoformat(event.start).replace(tzinfo=user_tz)
            end_dt = datetime.fromisoformat(event.end).replace(tzinfo=user_tz)

            event_payload["start"] = {
                "dateTime": start_dt.isoformat(),
                "timeZone": canonical_timezone,
            }
            event_payload["end"] = {
                "dateTime": end_dt.isoformat(),
                "timeZone": canonical_timezone,
            }
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid timezone or datetime format: {str(e)}"
            )

    # Send request to create the event
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=event_payload)

        # Handle response
        if response.status_code in (200, 201):
            return response.json()
        elif response.status_code == 403:
            raise HTTPException(
                status_code=403,
                detail="Insufficient authentication scopes. Please ensure your token includes the required scopes.",
            )
        elif response.status_code == 401 and refresh_token:
            # Try refreshing the token and retrying
            token_data = await refresh_access_token(refresh_token)
            if isinstance(token_data, dict):
                new_access_token = token_data.get("access_token")
                if new_access_token:
                    headers = {
                        "Authorization": f"Bearer {new_access_token}",
                        "Content-Type": "application/json",
                    }
                    async with httpx.AsyncClient() as client:
                        retry_response = await client.post(
                            url, headers=headers, json=event_payload
                        )
                    if retry_response.status_code in (200, 201):
                        return retry_response.json()
                    else:
                        error_json = retry_response.json()
                        if isinstance(error_json, dict):
                            error_msg = error_json.get("error", {}).get(
                                "message", "Unknown error"
                            )
                        else:
                            error_msg = "Unknown error"
                        raise HTTPException(
                            status_code=retry_response.status_code, detail=error_msg
                        )
                else:
                    raise HTTPException(
                        status_code=401, detail="Failed to refresh token"
                    )
            else:
                raise HTTPException(status_code=401, detail="Failed to refresh token")
        else:
            response_json = response.json()
            if isinstance(response_json, dict):
                error_detail = response_json.get("error", {}).get(
                    "message", "Unknown error"
                )
            else:
                error_detail = "Unknown error"
            raise HTTPException(status_code=response.status_code, detail=error_detail)
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to create event: {str(e)}")


async def get_user_calendar_preferences(user_id: str) -> Dict[str, List[str]]:
    """
    Retrieve the user's selected calendar preferences from the database.

    Args:
        user_id (str): The ID of the user whose preferences are being retrieved.

    Returns:
        Dict[str, List[str]]: A dictionary with the user's selected calendar IDs.

    Raises:
        HTTPException: If preferences are not found for the user.
    """
    preferences = await calendars_collection.find_one({"user_id": user_id})
    if preferences and "selected_calendars" in preferences:
        return {"selectedCalendars": preferences["selected_calendars"]}
    else:
        raise HTTPException(status_code=404, detail="Calendar preferences not found")


async def update_user_calendar_preferences(
    user_id: str, selected_calendars: List[str]
) -> Dict[str, str]:
    """
    Update the user's selected calendar preferences in the database.

    Args:
        user_id (str): The ID of the user whose preferences are being updated.
        selected_calendars (List[str]): The list of selected calendar IDs to save.

    Returns:
        Dict[str, str]: A message indicating the result of the update operation.
    """
    result = await calendars_collection.update_one(
        {"user_id": user_id},
        {"$set": {"selected_calendars": selected_calendars}},
        upsert=True,
    )
    if result.modified_count or result.upserted_id:
        return {"message": "Calendar preferences updated successfully"}
    else:
        return {"message": "No changes made to calendar preferences"}


async def search_calendar_events_native(
    query: str,
    user_id: str,
    access_token: str,
    refresh_token: Optional[str] = None,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Search calendar events using Google Calendar API's native search functionality.
    This is much more efficient than fetching all events and filtering locally.

    Args:
        query (str): Search query string
        user_id (str): User identifier
        access_token (str): Access token
        refresh_token (Optional[str]): Refresh token
        time_min (Optional[str]): Start time filter
        time_max (Optional[str]): End time filter

    Returns:
        dict: Search results with matching events
    """

    # Get user's selected calendars
    try:
        calendar_list_data = await fetch_calendar_list(access_token)
        valid_token = access_token
    except HTTPException as e:
        if e.status_code == 401 and refresh_token:
            token_data = await refresh_access_token(refresh_token)
            new_access_token = token_data.get("access_token")
            if new_access_token:
                valid_token = new_access_token
                calendar_list_data = await fetch_calendar_list(valid_token)
            else:
                raise e
            access_token = valid_token
        else:
            raise e

    calendars = calendar_list_data.get("items", [])

    # Get user's calendar preferences
    user_selected_calendars: List[str] = []
    preferences = await calendars_collection.find_one({"user_id": user_id})
    if preferences and preferences.get("selected_calendars"):
        user_selected_calendars = preferences["selected_calendars"]
        logger.info(f"User has calendar preferences: {user_selected_calendars}")
    else:
        # Default to primary calendar if no preferences set
        primary_calendar = next((cal for cal in calendars if cal.get("primary")), None)
        if primary_calendar:
            user_selected_calendars = [primary_calendar["id"]]
            logger.info(
                f"No preferences found, defaulting to primary calendar: {primary_calendar['id']}"
            )
        else:
            logger.warning("No primary calendar found")

    # Filter the calendars to only those that are selected
    selected_cal_objs = [
        cal for cal in calendars if cal["id"] in user_selected_calendars
    ]

    logger.info(
        f"Searching in {len(selected_cal_objs)} calendars: {[cal['summary'] for cal in selected_cal_objs]}"
    )

    # If no calendars are selected, search all available calendars
    if not selected_cal_objs:
        logger.info("No selected calendars found, searching all available calendars")
        selected_cal_objs = calendars

    # Create tasks for searching events concurrently across selected calendars
    tasks = [
        search_events_in_calendar(cal["id"], query, valid_token, time_min, time_max)
        for cal in selected_cal_objs
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_matching_events = []
    total_events_searched = 0

    # Process results from all calendars
    for cal, result in zip(selected_cal_objs, results):
        if isinstance(result, Exception):
            logger.error(f"Error searching events in calendar {cal['id']}: {result}")
            continue

        # Cast result to a dictionary explicitly
        result_dict = cast(Dict[str, Any], result)

        events = result_dict.get("items", [])
        logger.info(
            f"Found {len(events)} events in calendar '{cal.get('summary', cal['id'])}'"
        )

        for event in events:
            event["calendarId"] = cal["id"]
            event["calendarTitle"] = cal.get("summary", "")

        filtered_events = filter_events(events)
        logger.info(
            f"After filtering: {len(filtered_events)} events in calendar '{cal.get('summary', cal['id'])}'"
        )

        all_matching_events.extend(filtered_events)

        # Add to total count for statistics
        total_events_searched += len(filtered_events)

    logger.info(
        f"Total matching events across all calendars: {len(all_matching_events)}"
    )

    # If no events found in selected calendars, try searching all calendars
    if not all_matching_events and selected_cal_objs != calendars:
        logger.info("No events found in selected calendars, searching all calendars...")

        # Search all calendars
        all_calendar_tasks = [
            search_events_in_calendar(cal["id"], query, valid_token, time_min, time_max)
            for cal in calendars
        ]
        all_calendar_results = await asyncio.gather(
            *all_calendar_tasks, return_exceptions=True
        )

        # Process results from all calendars
        for cal, result in zip(calendars, all_calendar_results):
            if isinstance(result, Exception):
                logger.error(
                    f"Error searching events in calendar {cal['id']}: {result}"
                )
                continue

            result_dict = cast(Dict[str, Any], result)
            events = result_dict.get("items", [])

            if events:
                logger.info(
                    f"Found {len(events)} events in calendar '{cal.get('summary', cal['id'])}'"
                )

                for event in events:
                    event["calendarId"] = cal["id"]
                    event["calendarTitle"] = cal.get("summary", "")

                filtered_events = filter_events(events)
                all_matching_events.extend(filtered_events)
                total_events_searched += len(filtered_events)

    return {
        "query": query,
        "matching_events": all_matching_events,
        "total_matches": len(all_matching_events),
        "total_events_searched": total_events_searched,
        "searched_calendars": [cal["summary"] for cal in selected_cal_objs],
    }


async def search_events_in_calendar(
    calendar_id: str,
    query: str,
    access_token: str,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Search events in a specific calendar using Google Calendar API's native search.

    Args:
        calendar_id (str): Calendar identifier
        query (str): Search query string
        access_token (str): Access token
        time_min (Optional[str]): Start time filter
        time_max (Optional[str]): End time filter

    Returns:
        dict: Search results from the specific calendar
    """
    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"
    headers = {"Authorization": f"Bearer {access_token}"}

    params: Dict[str, Union[str, int, bool]] = {
        "q": query,  # This is the key parameter for native search
        "maxResults": 50,
        "singleEvents": True,
        "orderBy": "startTime",
    }

    # Only add time filters if they are explicitly provided
    if time_min:
        params["timeMin"] = time_min
    if time_max:
        params["timeMax"] = time_max

    try:
        logger.info(
            f"Searching calendar {calendar_id} with query '{query}' and params: {params}"
        )
        response = await http_async_client.get(url, headers=headers, params=params)
        if response.status_code == 200:
            result = response.json()
            event_count = len(result.get("items", []))
            logger.info(f"Calendar {calendar_id} search returned {event_count} events")
            return result
        else:
            error_detail = (
                response.json().get("error", {}).get("message", "Unknown error")
            )
            logger.error(
                f"Calendar {calendar_id} search failed: {response.status_code} - {error_detail}"
            )
            raise HTTPException(status_code=response.status_code, detail=error_detail)
    except httpx.RequestError as e:
        logger.error(f"HTTP search request failed for calendar {calendar_id}: {e}")
        raise HTTPException(status_code=500, detail=f"HTTP search request failed: {e}")


async def delete_calendar_event(
    event: EventDeleteRequest,
    access_token: str,
    refresh_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Delete a calendar event using the Google Calendar API.

    Args:
        event (EventDeleteRequest): The event deletion request details.
        access_token (str): The access token.
        refresh_token (Optional[str]): Refresh token.

    Returns:
        dict: Confirmation of deletion.

    Raises:
        HTTPException: If event deletion fails.
    """
    calendar_id = event.calendar_id or "primary"
    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events/{event.event_id}"

    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=headers)

        if response.status_code == 204:
            return {"success": True, "message": "Event deleted successfully"}
        elif response.status_code == 404:
            raise HTTPException(
                status_code=404, detail="Event not found or already deleted"
            )
        elif response.status_code == 401 and refresh_token:
            # Try refreshing the token and retrying
            token_data = await refresh_access_token(refresh_token)
            if isinstance(token_data, dict):
                new_access_token = token_data.get("access_token")
                if new_access_token:
                    headers = {"Authorization": f"Bearer {new_access_token}"}
                    async with httpx.AsyncClient() as client:
                        retry_response = await client.delete(url, headers=headers)
                    if retry_response.status_code == 204:
                        return {
                            "success": True,
                            "message": "Event deleted successfully",
                        }
                    elif retry_response.status_code == 404:
                        raise HTTPException(
                            status_code=404, detail="Event not found or already deleted"
                        )
                    else:
                        error_msg = "Unknown error occurred during deletion"
                        if retry_response.content:
                            try:
                                error_json = retry_response.json()
                                if isinstance(error_json, dict):
                                    error_msg = error_json.get("error", {}).get(
                                        "message", error_msg
                                    )
                            except Exception:
                                pass
                        raise HTTPException(
                            status_code=retry_response.status_code, detail=error_msg
                        )
                else:
                    raise HTTPException(
                        status_code=401, detail="Failed to refresh token"
                    )
            else:
                raise HTTPException(status_code=401, detail="Failed to refresh token")
        else:
            error_msg = "Unknown error occurred during deletion"
            if response.content:
                try:
                    error_json = response.json()
                    if isinstance(error_json, dict):
                        error_msg = error_json.get("error", {}).get(
                            "message", error_msg
                        )
                except Exception:
                    pass
            raise HTTPException(status_code=response.status_code, detail=error_msg)
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete event: {str(e)}")


async def update_calendar_event(
    event: EventUpdateRequest,
    access_token: str,
    refresh_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Update a calendar event using the Google Calendar API.

    Args:
        event (EventUpdateRequest): The event update request details.
        access_token (str): The access token.
        refresh_token (Optional[str]): Refresh token.

    Returns:
        dict: The updated event details.

    Raises:
        HTTPException: If event update fails.
    """
    calendar_id = event.calendar_id or "primary"
    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events/{event.event_id}"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # First, get the existing event to preserve fields that weren't updated
    try:
        async with httpx.AsyncClient() as client:
            get_response = await client.get(
                url, headers={"Authorization": f"Bearer {access_token}"}
            )

        if get_response.status_code != 200:
            raise HTTPException(
                status_code=404, detail="Event not found or access denied"
            )

        existing_event = get_response.json()

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch existing event: {str(e)}"
        )

    # Create the update payload, preserving existing values for unspecified fields
    event_payload = {
        "summary": (
            event.summary
            if event.summary is not None
            else existing_event.get("summary", "")
        ),
        "description": (
            event.description
            if event.description is not None
            else existing_event.get("description", "")
        ),
    }

    # Handle time updates
    if event.start is not None or event.end is not None or event.is_all_day is not None:
        is_all_day = (
            event.is_all_day
            if event.is_all_day is not None
            else existing_event.get("start", {}).get("date") is not None
        )

        if is_all_day:
            # Handle all-day event updates
            if event.start is not None:
                start_date = (
                    event.start.split("T")[0] if "T" in event.start else event.start
                )
            else:
                start_date = existing_event.get("start", {}).get("date", "")

            if event.end is not None:
                end_date = event.end.split("T")[0] if "T" in event.end else event.end
            else:
                end_date = existing_event.get("end", {}).get("date", "")

            event_payload["start"] = {"date": start_date}
            event_payload["end"] = {"date": end_date}
        else:
            # Handle time-specific event updates
            try:
                timezone = event.timezone or existing_event.get("start", {}).get(
                    "timeZone", "UTC"
                )
                canonical_timezone = resolve_timezone(timezone)
                user_tz = ZoneInfo(canonical_timezone)

                if event.start is not None:
                    start_dt = datetime.fromisoformat(event.start).replace(
                        tzinfo=user_tz
                    )
                else:
                    # Parse existing start time
                    existing_start = existing_event.get("start", {}).get("dateTime", "")
                    start_dt = datetime.fromisoformat(
                        existing_start.replace("Z", "+00:00")
                    )

                if event.end is not None:
                    end_dt = datetime.fromisoformat(event.end).replace(tzinfo=user_tz)
                else:
                    # Parse existing end time
                    existing_end = existing_event.get("end", {}).get("dateTime", "")
                    end_dt = datetime.fromisoformat(existing_end.replace("Z", "+00:00"))

                event_payload["start"] = {
                    "dateTime": start_dt.isoformat(),
                    "timeZone": canonical_timezone,
                }
                event_payload["end"] = {
                    "dateTime": end_dt.isoformat(),
                    "timeZone": canonical_timezone,
                }
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid timezone or datetime format: {str(e)}",
                )
    else:
        # Preserve existing start/end times
        event_payload["start"] = existing_event.get("start", {})
        event_payload["end"] = existing_event.get("end", {})

    # Send request to update the event
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(url, headers=headers, json=event_payload)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            raise HTTPException(
                status_code=404, detail="Event not found or access denied"
            )
        elif response.status_code == 401 and refresh_token:
            # Try refreshing the token and retrying
            token_data = await refresh_access_token(refresh_token)
            if isinstance(token_data, dict):
                new_access_token = token_data.get("access_token")
                if new_access_token:
                    headers = {
                        "Authorization": f"Bearer {new_access_token}",
                        "Content-Type": "application/json",
                    }
                    async with httpx.AsyncClient() as client:
                        retry_response = await client.put(
                            url, headers=headers, json=event_payload
                        )
                    if retry_response.status_code == 200:
                        return retry_response.json()
                    else:
                        error_json = retry_response.json()
                        if isinstance(error_json, dict):
                            error_msg = error_json.get("error", {}).get(
                                "message", "Unknown error"
                            )
                        else:
                            error_msg = "Unknown error"
                        raise HTTPException(
                            status_code=retry_response.status_code, detail=error_msg
                        )
                else:
                    raise HTTPException(
                        status_code=401, detail="Failed to refresh token"
                    )
            else:
                raise HTTPException(status_code=401, detail="Failed to refresh token")
        else:
            response_json = response.json()
            if isinstance(response_json, dict):
                error_detail = response_json.get("error", {}).get(
                    "message", "Unknown error"
                )
            else:
                error_detail = "Unknown error"
            raise HTTPException(status_code=response.status_code, detail=error_detail)
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to update event: {str(e)}")
