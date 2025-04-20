from typing import List, Optional

from pydantic import BaseModel, EmailStr
from typing_extensions import TypedDict


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


class MessageDict(TypedDict):
    role: str
    content: str
    # mostRecent: bool


class FileData(BaseModel):
    fileId: str
    url: str
    filename: str
    description: Optional[str] = None
    type: Optional[str] = "file"
    message: Optional[str] = "File uploaded successfully"


class MessageRequestWithHistory(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    messages: List[MessageDict]
    search_web: Optional[bool] = False
    deep_search: Optional[bool] = False
    pageFetchURLs: Optional[List] = []
    fileIds: Optional[List[str]] = []
    fileData: Optional[
        List[FileData]
    ] = []  # TODO: Remove this field, we should not request it from the frontend
    # deep_search_results: Optional[Dict[str, Any]] = None


class MessageRequest(BaseModel):
    message: str


class MessageRequestPrimary(BaseModel):
    message: str
    conversation_id: str
