from fastapi import APIRouter, Cookie, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

from app.models.calendar_models import EventCreateRequest
from app.services.calendar_service import (
    create_calendar_event,
    get_all_calendar_events,
    get_calendar_events,
    get_calendar_events_by_id,
    list_calendars,
)
from app.db.collections import calendars_collection

router = APIRouter()


@router.get("/calendar/list", summary="Get Calendar List")
async def get_calendar_list(
    access_token: str = Cookie(None), refresh_token: str = Cookie(None)
):
    """
    Retrieve the list of calendars for the authenticated user.
    If the access token is expired and a refresh token is provided, the token will be refreshed.
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token required")
    try:
        return await list_calendars(access_token, refresh_token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar/events", summary="Get Events from Selected Calendars")
async def get_events(
    access_token: str = Cookie(None),
    refresh_token: str = Cookie(None),
    user_id: str = Cookie(None),
    page_token: Optional[str] = None,
    selected_calendars: Optional[List[str]] = Query(None),
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
):
    """
    Retrieve events from the user's selected calendars.
    If no calendars are provided, the primary calendar or previously stored user preferences will be used.
    Supports pagination via the page_token parameter.
    """
    if not access_token or not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        return await get_calendar_events(
            user_id=user_id,
            access_token=access_token,
            refresh_token=refresh_token,
            page_token=page_token,
            selected_calendars=selected_calendars,
            time_min=time_min,
            time_max=time_max,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar/{calendar_id}/events", summary="Get Events by Calendar ID")
async def get_events_by_calendar(
    calendar_id: str,
    access_token: str = Cookie(None),
    refresh_token: str = Cookie(None),
    page_token: Optional[str] = None,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
):
    """
    Fetch events for a specific calendar identified by its ID.
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token required")
    try:
        return await get_calendar_events_by_id(
            calendar_id=calendar_id,
            access_token=access_token,
            refresh_token=refresh_token,
            page_token=page_token,
            time_min=time_min,
            time_max=time_max,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calendar/event", summary="Create a Calendar Event")
async def create_event(
    event: EventCreateRequest,
    access_token: str = Cookie(None),
    refresh_token: str = Cookie(None),
):
    """
    Create a new calendar event.
    This endpoint accepts non-canonical timezone names, which are normalized in the service.
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token required")
    try:
        return await create_calendar_event(event, access_token, refresh_token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar/all/events", summary="Get Events from All Calendars")
async def get_all_events(
    access_token: str = Cookie(None),
    refresh_token: str = Cookie(None),
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
):
    """
    Retrieve events for every calendar associated with the user concurrently.
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token required")
    try:
        return await get_all_calendar_events(
            access_token, refresh_token, time_min, time_max
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CalendarPreferencesUpdateRequest(BaseModel):
    """
    Request model for updating user calendar preferences.
    """

    selected_calendars: List[str]


@router.get("/calendar/preferences", summary="Get User Calendar Preferences")
async def get_calendar_preferences(user_id: str = Cookie(None)):
    """
    Retrieve the user's selected calendars from the database.

    Returns:
        A dictionary containing the user's selected calendar IDs.

    Raises:
        HTTPException: If the user_id is not provided or preferences not found.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")
    preferences = await calendars_collection.find_one({"user_id": user_id})
    if preferences and "selected_calendars" in preferences:
        return {"selectedCalendars": preferences["selected_calendars"]}
    else:
        raise HTTPException(status_code=404, detail="Calendar preferences not found")


@router.put("/calendar/preferences", summary="Update User Calendar Preferences")
async def update_calendar_preferences(
    preferences: CalendarPreferencesUpdateRequest, user_id: str = Cookie(None)
):
    """
    Update the user's selected calendars in the database.

    Args:
        preferences (CalendarPreferencesUpdateRequest): The request body containing selected calendar IDs.
        user_id (str): The authenticated user ID.

    Returns:
        A dictionary with a success message.

    Raises:
        HTTPException: If user_id is not provided.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")

    result = await calendars_collection.update_one(
        {"user_id": user_id},
        {"$set": {"selected_calendars": preferences.selected_calendars}},
        upsert=True,
    )
    if result.modified_count or result.upserted_id:
        return {"message": "Calendar preferences updated successfully"}
    else:
        return {"message": "No changes made to calendar preferences"}
