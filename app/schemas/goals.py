from pydantic import BaseModel
from typing import Optional


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = ""


class GoalResponse(BaseModel):
    id: str
    title: str
    progress: int
    description: str
    roadmap: dict
    user_id: str
    created_at: str


class RoadmapUnavailableResponse(BaseModel):
    message: str
    id: str
    title: str


class UpdateNodeRequest(BaseModel):
    is_complete: bool
