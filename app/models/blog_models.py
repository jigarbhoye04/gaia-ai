from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId


class AuthorDetails(BaseModel):
    """Author details model for populated team member information."""

    id: Optional[str] = None
    name: str
    role: str
    avatar: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None


class BlogPostBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    authors: List[str]  # Team member IDs
    readTime: Optional[str] = None
    category: Optional[str] = None
    content: str
    image: Optional[str] = None
    tags: Optional[List[str]] = None


class BlogPostCreate(BlogPostBase):
    slug: str


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    authors: Optional[List[str]] = None
    readTime: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    image: Optional[str] = None
    tags: Optional[List[str]] = None


class BlogPost(BlogPostBase):
    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    slug: str
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    author_details: Optional[List[AuthorDetails]] = None
