from typing import Optional

from pydantic import BaseModel, EmailStr


class WaitlistItem(BaseModel):
    email: EmailStr
    user_agent: Optional[str] = None
    device_type: Optional[str] = None
    screen_resolution: Optional[str] = None
    dark_mode: Optional[bool] = None
    cookies_enabled: Optional[bool] = None
    referrer: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    ip_address: Optional[str] = None
    page_load_time: Optional[float] = None
    joined_at: Optional[str] = None
    cpu_architecture: Optional[str] = None
    page_load_timestamp: Optional[str] = None
    time_elapsed_ms: Optional[str] = None
    time_elapsed_seconds: Optional[str] = None


class FeedbackFormData(BaseModel):
    name: str
    email: str
    message: str
