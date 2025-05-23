from pydantic import BaseModel, Field
from typing import List, Optional


class CalendarPreferencesUpdateRequest(BaseModel):
    selected_calendars: List[str]


class EventCreateRequest(BaseModel):
    summary: str = Field(..., title="Event Summary")
    description: str = Field("", title="Event Description")
    start: Optional[str] = Field(None, title="Start Time in ISO 8601 format")
    end: Optional[str] = Field(None, title="End Time in ISO 8601 format")
    is_all_day: bool = Field(False, title="Is All Day Event")
    timezone: str = Field(
        "UTC", title="Event Timezone that comes from the client ex- Asia/Calcutta"
    )
    calendar_id: Optional[str] = Field(None, title="Calendar ID")
    calendar_name: Optional[str] = None  # Name of the calendar for display purposes
    calendar_color: Optional[str] = "#00bbff"
    
    @property
    def event_date(self) -> str:
        """
        Returns the date part for all-day events.
        For all-day events without start time, returns today's date in YYYY-MM-DD format.
        """
        if self.is_all_day and not self.start:
            from datetime import datetime
            return datetime.now().strftime("%Y-%m-%d")
        elif self.start:
            # Extract date part from ISO datetime string
            return self.start.split("T")[0] if "T" in self.start else self.start
        return None
