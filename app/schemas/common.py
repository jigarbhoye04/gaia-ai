from pydantic import BaseModel, EmailStr
from typing import List, Dict, TypedDict


class WaitlistItem(BaseModel):
    email: EmailStr


class FeedbackFormData(BaseModel):
    firstName: str
    lastName: str
    currentPage: int
    ageRange: str
    occupation: str
    email: EmailStr
    devices: List[str]
    operatingSystems: List[str]
    openAIUsage: int
    googleBardUsage: int
    usesDigitalAssistant: str
    digitalAssistantDetails: List[str]
    currentUsefulFeatures: str
    desiredFeatures: str
    challenges: str
    helpfulSituations: List[str]
    interactionFrequency: str
    customisationLevel: int
    mobileAppLikelihood: int
    concerns: str
    factorsToUse: str
    integrations: str
    additionalComments: str
    accountCreation: int
    calendarServiceUsage: str
    learningBehaviourComfortable: str


class MessageDict(TypedDict):
    role: str
    content: str
    # mostRecent: bool


class MessageRequestWithHistory(BaseModel):
    message: str
    messages: List[MessageDict]


class MessageRequest(BaseModel):
    message: str


class MessageRequestPrimary(BaseModel):
    message: str
    conversation_id: str


class DescriptionUpdateRequest(BaseModel):
    userFirstMessage: str
