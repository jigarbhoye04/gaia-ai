from pydantic import BaseModel, EmailStr
from typing import List, Optional


class EmailRequest(BaseModel):
    subject: str
    body: str
    prompt: str
    writingStyle: str
    contentLength: str
    clarityOption: str


class SendEmailRequest(BaseModel):
    to: List[EmailStr]
    subject: str
    body: str
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None


class EmailSummaryRequest(BaseModel):
    message_id: str
    include_key_points: bool = True
    include_action_items: bool = True
    max_length: Optional[int] = 150
