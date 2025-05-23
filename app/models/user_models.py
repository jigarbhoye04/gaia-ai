from datetime import datetime

from pydantic import BaseModel, Field


class CurrentUserModel(BaseModel):
    user_id: str = Field(..., description="Unique identifier for the user")
    name: str = Field(..., description="Name of the user")
    email: str = Field(..., description="Email address of the user")
    cached_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the user data was cached",
    )
    picture: str = Field(
        default=None, description="URL of the user's profile picture"
    )
    is_active: bool = Field(default=True, description="Indicates if the user is active")

    class Config:
        arbitrary_types_allowed = True
