from pydantic import BaseModel, HttpUrl
from typing import Optional


class URLRequest(BaseModel):
    url: HttpUrl


class URLResponse(BaseModel):
    title: str
    description: str
    website_name: Optional[str] = None
    favicon: Optional[str] = None
