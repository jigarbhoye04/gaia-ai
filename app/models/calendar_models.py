from pydantic import BaseModel, Field
from datetime import datetime


class EventCreateRequest(BaseModel):
    summary: str = Field(..., title="Event Summary")
    description: str = Field("", title="Event Description")
    start: datetime = Field(..., title="Start Time")
    end: datetime = Field(..., title="End Time")
    timezone: str = "UTC"
