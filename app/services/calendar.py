from fastapi import HTTPException
from typing import Optional
import httpx
from datetime import datetime, timezone

http_async_client = httpx.AsyncClient()

def filter_events(events):
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
    """Helper function to fetch events from a specific calendar"""
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
