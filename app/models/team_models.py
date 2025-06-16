from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from bson import ObjectId


class TeamMemberBase(BaseModel):
    name: str
    role: str
    email: EmailStr
    avatar: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    bio: Optional[str] = None


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    bio: Optional[str] = None


class TeamMember(TeamMemberBase):
    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True
    )
    
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")