from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId


class BlogPostBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    authors: List[str]
    readTime: Optional[str] = None
    category: Optional[str] = None
    content: str


class BlogPostCreate(BlogPostBase):
    slug: str


class BlogPostUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    date: Optional[str]
    authors: Optional[List[str]]
    readTime: Optional[str]
    category: Optional[str]
    content: Optional[str]


class BlogPost(BlogPostBase):
    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True
    )
    
    slug: str
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
