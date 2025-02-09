from fastapi import APIRouter, HTTPException, Cookie, Query
from typing import Optional, List
import httpx
from datetime import datetime, timezone
from app.services.calendar_service import fetch_calendar_events, filter_events
from app.db.connect import calendar_collection
from pydantic import BaseModel, Field
from app.utils.auth_utils import (
    GOOGLE_TOKEN_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
)

router = APIRouter()
http_async_client = httpx.AsyncClient()


async def refresh_access_token(refresh_token: str):
    """Helper function to refresh the access token"""
    response = await http_async_client.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
    )
    return response


@router.get("/calendar/list")
async def get_calendar_list(
    access_token: str = Cookie(None), refresh_token: str = Cookie(None)
):
    """Get list of all available calendars"""
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token required")

    try:
        url = "https://www.googleapis.com/calendar/v3/users/me/calendarList"
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await http_async_client.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401 and refresh_token:
            # Try refreshing the token
            refresh_response = await refresh_access_token(refresh_token)
            if refresh_response.status_code == 200:
                new_tokens = refresh_response.json()
                new_access_token = new_tokens.get("access_token")
                return await get_calendar_list(new_access_token, refresh_token)
            else:
                raise HTTPException(
                    status_code=400, detail="Unable to refresh access token"
                )
        else:
            raise HTTPException(
                status_code=response.status_code, detail="Failed to fetch calendar list"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar/events")
async def get_calendar_events(
    access_token: str = Cookie(None),
    refresh_token: str = Cookie(None),
    user_id: str = Cookie(None),
    page_token: Optional[str] = None,
    selected_calendars: Optional[List[str]] = Query(None),
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
):
    """Get events from selected calendars with pagination and storage"""
    if not access_token or not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        # Set time_min to the current date and time if not provided
        if not time_min:
            time_min = datetime.now(timezone.utc).isoformat()

        # Fetch the list of calendars
        calendar_list_response = await http_async_client.get(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if calendar_list_response.status_code == 200:
            calendar_data = calendar_list_response.json()
            calendars = calendar_data.get("items", [])

            # Determine selected calendars
            if selected_calendars:
                # If calendars are explicitly provided, store them
                await calendar_collection.update_one(
                    {"user_id": user_id},
                    {"$set": {"selected_calendars": selected_calendars}},
                    upsert=True,
                )
            else:
                # Try to fetch previously stored calendars
                preferences = await calendar_collection.find_one({"user_id": user_id})

                # If no stored calendars, default to primary
                if preferences and preferences.get("selected_calendars"):
                    selected_calendars = preferences["selected_calendars"]
                else:
                    primary_calendar = next(
                        (cal for cal in calendars if cal.get("primary")), None
                    )
                    if primary_calendar:
                        selected_calendars = [primary_calendar["id"]]
                        # Store primary calendar
                        await calendar_collection.update_one(
                            {"user_id": user_id},
                            {"$set": {"selected_calendars": selected_calendars}},
                            upsert=True,
                        )
                    else:
                        selected_calendars = []

            calendars = [
                calendar
                for calendar in calendars
                if calendar["id"] in selected_calendars
            ]

            all_events = []
            next_page_token = None

            # Fetch events from each selected calendar
            for calendar in calendars:
                calendar_id = calendar["id"]
                events_response = await fetch_calendar_events(
                    calendar_id, access_token, page_token, time_min, time_max
                )

                if events_response.status_code == 200:
                    events_data = events_response.json()
                    events = events_data.get("items", [])
                    # Add calendar info to each event
                    for event in events:
                        event["calendarId"] = calendar_id
                        event["calendarTitle"] = calendar.get("summary", "")

                    filtered_events = filter_events(events)
                    all_events.extend(filtered_events)
                    # Keep track of pagination token
                    if events_data.get("nextPageToken"):
                        next_page_token = events_data["nextPageToken"]

            return {
                "events": all_events,
                "nextPageToken": next_page_token,
                "selectedCalendars": selected_calendars,
            }

        elif calendar_list_response.status_code == 401 and refresh_token:
            # Handle token refresh
            refresh_response = await refresh_access_token(refresh_token)
            if refresh_response.status_code == 200:
                tokens = refresh_response.json()
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
                    status_code=400, detail="Unable to refresh access token"
                )
        else:
            raise HTTPException(
                status_code=calendar_list_response.status_code,
                detail="Failed to fetch calendar list",
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar/{calendar_id}/events")
async def get_calendar_events_by_id(
    calendar_id: str,
    access_token: str = Cookie(None),
    refresh_token: str = Cookie(None),
    page_token: Optional[str] = None,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
):
    """Fetch events from a specific calendar by calendar_id"""
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token required")

    try:
        # Set time_min to the current date and time if not provided
        if not time_min:
            time_min = datetime.now(timezone.utc).isoformat()

        events_response = await fetch_calendar_events(
            calendar_id, access_token, page_token, time_min, time_max
        )

        if events_response.status_code == 200:
            events_data = events_response.json()
            events = filter_events(events_data.get("items", []))
            return {
                # "events": sorted(
                #     events,
                #     key=lambda event: event.get("start", {}).get(
                #         "dateTime", event.get("start", {}).get("date", "")
                #     ),
                # ),
                "events": events,
                "nextPageToken": events_data.get("nextPageToken"),
            }
        elif events_response.status_code == 400:
            raise HTTPException(status_code=400, detail="Invalid request parameters.")
        elif events_response.status_code == 401 and refresh_token:
            refresh_response = await refresh_access_token(refresh_token)
            if refresh_response.status_code == 200:
                new_access_token = refresh_response.json().get("access_token")
                return await get_calendar_events_by_id(
                    calendar_id,
                    new_access_token,
                    refresh_token,
                    page_token,
                    time_min,
                    time_max,
                )
            else:
                raise HTTPException(
                    status_code=400, detail="Unable to refresh access token"
                )
        else:
            raise HTTPException(
                status_code=events_response.status_code,
                detail=events_response.json()
                .get("error", {})
                .get("message", "Unknown error"),
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {e}")


class EventCreateRequest(BaseModel):
    summary: str = Field(..., title="Event Summary")
    description: str = Field("", title="Event Description")
    start: datetime = Field(..., title="Start Time")
    end: datetime = Field(..., title="End Time")


@router.post("/calendar/event")
async def create_calendar_event(
    event: EventCreateRequest,
    access_token: str = Cookie(None),
    refresh_token: str = Cookie(None),
):
    """
    Create a new calendar event

    Args:
        event: Event details
        access_token: OAuth2 access token
        refresh_token: OAuth2 refresh token
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token required")

    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        event_payload = {
            "summary": event.summary,
            "description": event.description,
            "start": event.start.dict(),
            "end": event.end.dict(),
        }

        response = await http_async_client.post(
            url, headers=headers, json=event_payload
        )

        match response.status_code:
            case 200:
                return response.json()
            case 401:
                if refresh_token:
                    # Handle token refresh similar to get_calendar_events_by_id
                    raise HTTPException(
                        status_code=401,
                        detail="Token expired. Please refresh and try again.",
                    )
                raise HTTPException(status_code=401, detail="Invalid access token")
            case _:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json()
                    .get("error", {})
                    .get("message", "Unknown error"),
                )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")