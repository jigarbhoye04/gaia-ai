from pydantic import BaseModel,EmailStr
from typing import List

class WaitlistItem(BaseModel):
    email: str
    firstName: str
    lastName: str

class FormData(BaseModel):
    firstName:str
    lastName:str
    currentPage: int
    ageRange: str
    occupation: str
    email: EmailStr
    phone: str
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



class MessageRequest(BaseModel):
    message: str


class MessageResponse(BaseModel):
    response: str
