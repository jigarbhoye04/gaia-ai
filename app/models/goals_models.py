from typing import Optional
from pydantic import BaseModel

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None

class GoalResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: str

class RoadmapUnavailableResponse(BaseModel):
    message: str

class UpdateNodeRequest(BaseModel):
    status: str
