from pydantic import BaseModel, Field
from datetime import datetime
from typing import List


class EventCreateRequest(BaseModel):
    summary: str = Field(..., title="Event Summary")
    description: str = Field("", title="Event Description")
    start: datetime = Field(..., title="Start Time")
    end: datetime = Field(..., title="End Time")
    timezone: str = "UTC"


class CalendarPreferencesUpdateRequest(BaseModel):
    selected_calendars: List[str]
