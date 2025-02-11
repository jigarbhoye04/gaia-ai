from typing import List, Optional

from fastapi import APIRouter, Cookie, HTTPException, Query

from app.models.calendar_models import EventCreateRequest
from app.services.calendar_service import (
    create_calendar_event,
    get_all_calendar_events,
    get_calendar_events,
    get_calendar_events_by_id,
    list_calendars,
)

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
