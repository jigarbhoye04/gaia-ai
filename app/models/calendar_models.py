from pydantic import BaseModel, Field
from typing import List, Optional


class CalendarPreferencesUpdateRequest(BaseModel):
    selected_calendars: List[str]


class EventCreateRequest(BaseModel):
    summary: str = Field(..., title="Event Summary")
    description: str = Field("", title="Event Description")
    start: str = Field(..., title="Start Time in ISO 8601 format")
    end: str = Field(..., title="End Time in ISO 8601 format")
    is_all_day: bool = Field(False, title="Is All Day Event")
    timezone: str = Field(
        "UTC", title="Event Timezone that comes from the client ex- Asia/Calcutta"
    )
    calendar_id: Optional[str] = Field(None, title="Calendar ID")
    calendar_name: Optional[str] = None  # Name of the calendar for display purposes
    calendar_color: Optional[str] = "#00bbff"
