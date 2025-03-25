from pydantic import BaseModel, EmailStr
from typing import List, Optional
from typing_extensions import TypedDict


class WaitlistItem(BaseModel):
    email: EmailStr


class FeedbackFormData(BaseModel):
    name: str
    email: str
    message: str


class MessageDict(TypedDict):
    role: str
    content: str
    # mostRecent: bool


class MessageRequestWithHistory(BaseModel):
    message: str
    conversation_id: str
    messages: List[MessageDict]
    search_web: Optional[bool] = False
    deep_search: Optional[bool] = False
    pageFetchURLs: Optional[List] = []


class MessageRequest(BaseModel):
    message: str


class MessageRequestPrimary(BaseModel):
    message: str
    conversation_id: str


class DescriptionUpdateRequestLLM(BaseModel):
    userFirstMessage: str
    model: str = "@cf/meta/llama-3.2-3b-instruct"


class DescriptionUpdateRequest(BaseModel):
    description: str
