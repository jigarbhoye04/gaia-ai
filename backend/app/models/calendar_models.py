from pydantic import BaseModel, Field, model_validator
from typing import List, Optional


class CalendarPreferencesUpdateRequest(BaseModel):
    selected_calendars: List[str]


class EventDeleteRequest(BaseModel):
    event_id: str = Field(..., title="Event ID to delete")
    calendar_id: str = Field("primary", title="Calendar ID containing the event")
    summary: Optional[str] = Field(None, title="Event summary for confirmation")
    

class EventUpdateRequest(BaseModel):
    event_id: str = Field(..., title="Event ID to update")
    calendar_id: str = Field("primary", title="Calendar ID containing the event")
    summary: Optional[str] = Field(None, title="Updated event summary")
    description: Optional[str] = Field(None, title="Updated event description")
    start: Optional[str] = Field(None, title="Updated start time in ISO 8601 format")
    end: Optional[str] = Field(None, title="Updated end time in ISO 8601 format")
    is_all_day: Optional[bool] = Field(None, title="Updated all-day status")
    timezone: Optional[str] = Field(None, title="Updated timezone")
    original_summary: Optional[str] = Field(None, title="Original event summary for confirmation")


class EventCreateRequest(BaseModel):
    summary: str = Field(..., title="Event Summary")
    description: str = Field("", title="Event Description")
    start: Optional[str] = Field(None, title="Start Time in ISO 8601 format or date for all-day events")
    end: Optional[str] = Field(None, title="End Time in ISO 8601 format or date for all-day events")
    is_all_day: bool = Field(False, title="Is All Day Event")
    timezone: str = Field(
        "UTC", title="Event Timezone that comes from the client ex- Asia/Calcutta"
    )
    calendar_id: Optional[str] = Field(None, title="Calendar ID")
    calendar_name: Optional[str] = None  # Name of the calendar for display purposes
    calendar_color: Optional[str] = "#00bbff"
    
    @model_validator(mode='after')
    def validate_event_times(self) -> 'EventCreateRequest':
        """
        Validate event data based on event type after model initialization.
        """
        if not self.is_all_day:
            # For timed events, both start and end are required
            if not self.start or not self.end:
                raise ValueError("Start and end times are required for timed events")
        # For all-day events, start and end are optional (will default to today if not provided)
        return self
    
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
        # Fallback to today's date
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d")
