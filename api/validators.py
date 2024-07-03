from pydantic import BaseModel


class WaitlistItem(BaseModel):
    email: str
    firstName: str
    lastName: str


class MessageRequest(BaseModel):
    message: str


class MessageResponse(BaseModel):
    response: str
