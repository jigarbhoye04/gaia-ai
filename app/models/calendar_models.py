from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class EventCreateRequest(BaseModel):
    summary: str = Field(..., title="Event Summary")
    description: str = Field("", title="Event Description")
    start: datetime = Field(..., title="Start Time")
    end: datetime = Field(..., title="End Time")
    timezone: str = "UTC"
    is_all_day: bool = Field(False, title="Is All Day Event")
    calendar_id: Optional[str] = Field(None, title="Calendar ID")


class CalendarPreferencesUpdateRequest(BaseModel):
    selected_calendars: List[str]
