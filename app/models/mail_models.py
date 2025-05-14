from typing import List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field


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


class EmailSearchRequest(BaseModel):
    """Request model for advanced email search functionality."""

    query: Optional[str] = None
    sender: Optional[str] = None
    recipient: Optional[str] = None
    subject: Optional[str] = None
    has_attachment: Optional[bool] = None
    attachment_type: Optional[str] = None
    date_from: Optional[Union[datetime, str]] = None
    date_to: Optional[Union[datetime, str]] = None
    labels: Optional[List[str]] = None
    is_read: Optional[bool] = None
    max_results: Optional[int] = Field(default=20, ge=1, le=100)
    page_token: Optional[str] = None


class LabelRequest(BaseModel):
    """Request model for creating or updating Gmail labels."""

    name: str
    label_list_visibility: Optional[str] = Field(
        default="labelShow",
        description="Whether the label appears in the label list: 'labelShow', 'labelHide', 'labelShowIfUnread'",
    )
    message_list_visibility: Optional[str] = Field(
        default="show",
        description="Whether the label appears in the message list: 'show', 'hide'",
    )
    background_color: Optional[str] = None
    text_color: Optional[str] = None


class ApplyLabelRequest(BaseModel):
    """Request model for applying or removing labels from messages."""

    message_ids: List[str]
    label_ids: List[str]


class DraftRequest(BaseModel):
    """Request model for creating or updating a draft email."""

    to: List[str]
    subject: str
    body: str
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    is_html: Optional[bool] = False
