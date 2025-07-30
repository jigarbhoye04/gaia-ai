import re
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class CalendarPreferencesUpdateRequest(BaseModel):
    selected_calendars: List[str]


class EventDeleteRequest(BaseModel):
    event_id: str = Field(..., title="Event ID to delete")
    calendar_id: str = Field("primary", title="Calendar ID containing the event")
    summary: Optional[str] = Field(None, title="Event summary for confirmation")


class RecurrenceRule(BaseModel):
    """
    Model representing a recurrence rule (RRULE) for a recurring event following RFC 5545.

    This model supports the core components needed to define recurring events in Google Calendar:
    - FREQ: Required frequency of repetition (daily, weekly, monthly, yearly)
    - INTERVAL: Optional interval between occurrences (default: 1)
    - COUNT: Optional number of occurrences
    - UNTIL: Optional end date (inclusive)
    - BYDAY: Optional days of week (e.g., for weekly events)
    - BYMONTHDAY: Optional days of month (e.g., for monthly events)
    - BYMONTH: Optional months of year (e.g., for yearly events)
    """

    frequency: Literal["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] = Field(
        ..., title="Frequency of repetition"
    )
    interval: Optional[int] = Field(1, title="Interval between occurrences", ge=1)
    count: Optional[int] = Field(None, title="Number of occurrences", ge=1)
    until: Optional[str] = Field(
        None, title="End date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS±HH:MM)"
    )
    by_day: Optional[List[str]] = Field(
        None, title="Days of week (SU, MO, TU, WE, TH, FR, SA)"
    )
    by_month_day: Optional[List[int]] = Field(
        None,
        title="Days of month (1-31)",
    )
    by_month: Optional[List[int]] = Field(None, title="Months of year (1-12)")

    exclude_dates: Optional[List[str]] = Field(
        None, title="Dates to exclude (in YYYY-MM-DD format)"
    )
    include_dates: Optional[List[str]] = Field(
        None, title="Additional dates to include (in YYYY-MM-DD format)"
    )

    @field_validator("by_day")
    @classmethod
    def validate_by_day(cls, v):
        if v:
            valid_days = {"SU", "MO", "TU", "WE", "TH", "FR", "SA"}
            for day in v:
                if day not in valid_days:
                    raise ValueError(
                        f"Invalid day value: {day}. Must be one of {valid_days}"
                    )
        return v

    @field_validator("by_month_day")
    @classmethod
    def validate_by_month_day(cls, v):
        if v:
            for day in v:
                if day < 1 or day > 31:
                    raise ValueError(
                        f"Invalid day of month: {day}. Must be between 1 and 31"
                    )
        return v

    @field_validator("by_month")
    @classmethod
    def validate_by_month(cls, v):
        if v:
            for month in v:
                if month < 1 or month > 12:
                    raise ValueError(
                        f"Invalid month: {month}. Must be between 1 and 12"
                    )
        return v

    @model_validator(mode="after")
    def validate_recurrence(self) -> "RecurrenceRule":
        """
        Validate the recurrence rule based on frequency type
        """
        # Cannot specify both count and until
        if self.count is not None and self.until is not None:
            raise ValueError(
                "Cannot specify both 'count' and 'until' in a recurrence rule"
            )

        # Validate the until date format if provided
        if self.until:
            try:
                # Try to parse the date to validate it
                if "T" in self.until:  # ISO datetime format
                    datetime.fromisoformat(self.until.replace("Z", "+00:00"))
                else:  # Simple date format
                    datetime.fromisoformat(self.until)
            except ValueError:
                raise ValueError(
                    "Invalid 'until' date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS±HH:MM)"
                )

        # Specific validations based on frequency
        if self.frequency == "WEEKLY" and not self.by_day:
            # For weekly frequency, by_day should typically be specified
            pass  # This is just a recommendation, not an error

        if self.frequency == "MONTHLY" and self.by_day and self.by_month_day:
            raise ValueError(
                "Cannot specify both 'by_day' and 'by_month_day' for monthly recurrence"
            )

        return self

    def to_rrule_string(self) -> str:
        """
        Convert the RecurrenceRule object to an RFC 5545 RRULE string
        """
        components = [f"FREQ={self.frequency}"]

        if self.interval != 1:
            components.append(f"INTERVAL={self.interval}")

        if self.count is not None:
            components.append(f"COUNT={self.count}")

        if self.until is not None:
            # Format UNTIL value according to RFC 5545
            if "T" in self.until:  # Contains time component
                # Ensure it ends with Z for UTC
                until_value = self.until.replace("+00:00", "Z")
                if not until_value.endswith("Z"):
                    try:
                        dt = datetime.fromisoformat(self.until)
                        until_value = dt.strftime("%Y%m%dT%H%M%SZ")
                    except ValueError:
                        until_value = self.until
            else:  # Just a date
                try:
                    dt = datetime.fromisoformat(self.until)
                    until_value = dt.strftime("%Y%m%d")
                except ValueError:
                    until_value = self.until.replace("-", "")

            components.append(f"UNTIL={until_value}")

        if self.by_day:
            components.append(f"BYDAY={','.join(self.by_day)}")

        if self.by_month_day:
            components.append(f"BYMONTHDAY={','.join(map(str, self.by_month_day))}")

        if self.by_month:
            components.append(f"BYMONTH={','.join(map(str, self.by_month))}")

        return "RRULE:" + ";".join(components)

    @field_validator("exclude_dates", "include_dates")
    @classmethod
    def validate_dates(cls, v):
        if v:
            date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")
            for date in v:
                if not date_pattern.match(date):
                    raise ValueError(
                        f"Invalid date format: {date}. Use YYYY-MM-DD format."
                    )
                try:
                    datetime.fromisoformat(date)
                except ValueError:
                    raise ValueError(f"Invalid date: {date}")
        return v

    model_config = {"extra": "forbid"}


class RecurrenceData(BaseModel):
    """
    Model representing the complete recurrence data for an event.

    This can include:
    - rrule: The main recurrence rule
    - exclude_dates: Specific dates to exclude from the recurrence pattern
    - include_dates: Additional specific dates to include in the pattern
    """

    rrule: RecurrenceRule = Field(..., title="Recurrence rule")

    def to_google_calendar_format(self) -> List[str]:
        """
        Convert the recurrence data to the format expected by Google Calendar API.

        Returns:
            List[str]: List of recurrence rules in RFC 5545 format
        """
        rules = [self.rrule.to_rrule_string()]

        if self.rrule.include_dates:
            # Format: "RDATE;VALUE=DATE:20150609,20150714"
            formatted_dates = ",".join(
                [date.replace("-", "") for date in self.rrule.include_dates]
            )
            rules.append(f"RDATE;VALUE=DATE:{formatted_dates}")

        if self.rrule.exclude_dates:
            # Format: "EXDATE;VALUE=DATE:20150610,20150715"
            formatted_dates = ",".join(
                [date.replace("-", "") for date in self.rrule.exclude_dates]
            )
            rules.append(f"EXDATE;VALUE=DATE:{formatted_dates}")

        rules.reverse()  # Reverse to match Google Calendar's order
        return rules

    model_config = {"extra": "forbid"}


class EventUpdateRequest(BaseModel):
    event_id: str = Field(..., title="Event ID to update")
    calendar_id: str = Field("primary", title="Calendar ID containing the event")
    summary: Optional[str] = Field(None, title="Updated event summary")
    description: Optional[str] = Field(None, title="Updated event description")
    start: Optional[str] = Field(None, title="Updated start time in ISO 8601 format")
    end: Optional[str] = Field(None, title="Updated end time in ISO 8601 format")
    is_all_day: Optional[bool] = Field(None, title="Updated all-day status")
    timezone: Optional[str] = Field(None, title="Updated timezone")
    original_summary: Optional[str] = Field(
        None, title="Original event summary for confirmation"
    )
    recurrence: Optional[RecurrenceData] = Field(
        None, title="Recurrence rules for recurring event"
    )


class EventCreateRequest(BaseModel):
    summary: str = Field(..., title="Event Summary")
    description: str = Field("", title="Event Description")
    start: Optional[str] = Field(
        None, title="Start Time in ISO 8601 format or date for all-day events"
    )
    end: Optional[str] = Field(
        None, title="End Time in ISO 8601 format or date for all-day events"
    )
    is_all_day: bool = Field(False, title="Is All Day Event")
    timezone: str = Field(
        "UTC", title="Event Timezone that comes from the client ex- Asia/Calcutta"
    )
    calendar_id: Optional[str] = Field(None, title="Calendar ID")
    calendar_name: Optional[str] = None  # Name of the calendar for display purposes
    calendar_color: Optional[str] = "#00bbff"
    recurrence: Optional[RecurrenceData] = Field(
        None, title="Recurrence rules for creating a recurring event"
    )

    @model_validator(mode="after")
    def validate_event_times(self) -> "EventCreateRequest":
        """
        Validate event data based on event type after model initialization.
        """
        if not self.is_all_day:
            # For timed events, both start and end are required
            if not self.start or not self.end:
                raise ValueError("Start and end times are required for timed events")

        # For all-day events, start and end are optional (will default to today if not provided)

        # For recurring events, ensure timezone is specified for non-all-day events
        if self.recurrence and not self.is_all_day:
            # Recurring events with time must have a timezone specified
            if not self.start or not self.end:
                raise ValueError(
                    "Recurring events must have start and end times specified"
                )

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
