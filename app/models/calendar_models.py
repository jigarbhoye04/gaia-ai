from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class CalendarPreferencesUpdateRequest(BaseModel):
    selected_calendars: List[str]


class EventCreateRequest(BaseModel):
    summary: str = Field(..., title="Event Summary")
    description: str = Field("", title="Event Description")
    start: datetime = Field(..., title="Start Time")
    end: datetime = Field(..., title="End Time")
    is_all_day: bool = Field(False, title="Is All Day Event")
    calendar_id: Optional[str] = Field(None, title="Calendar ID")
    calendar_name: Optional[str] = None  # Name of the calendar for display purposes
    calendar_color: Optional[str] = "#00bbff"
