from typing import List, Optional
from pydantic import BaseModel


class EmailRequest(BaseModel):
    prompt: str
    subject: Optional[str] = None
    body: Optional[str] = None
    writingStyle: Optional[str] = None
    contentLength: Optional[str] = None
    clarityOption: Optional[str] = None


class EmailSummaryRequest(BaseModel):
    message_id: str
    include_action_items: Optional[bool] = None
    max_length: Optional[int] = None


class SendEmailRequest(BaseModel):
    to: List[str]
    subject: str
    body: str
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None


class EmailReadStatusRequest(BaseModel):
    message_ids: List[str]


class EmailActionRequest(BaseModel):
    """Request model for performing actions on emails like star, trash, archive."""

    message_ids: List[str]
