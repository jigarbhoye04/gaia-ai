from typing import List, Optional, Union
from pydantic import BaseModel, HttpUrl


class URLRequest(BaseModel):
    url: str

class URLResponse(BaseModel):
    title: Union[str, None] = None
    description: Union[str, None] = None
    favicon: Union[str, None] = None
    website_name: Union[str, None] = None
    url: HttpUrl


class WebResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    date: str


class ImageResult(BaseModel):
    title: str
    url: str
    thumbnail: str
    source: str


class NewsResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    date: str


class VideoResult(BaseModel):
    title: str
    url: str
    thumbnail: str
    source: str


class SearchResults(BaseModel):
    web: Optional[List[WebResult]] = []  # noqa: F821
    images: Optional[List[ImageResult]] = []
    news: Optional[List[NewsResult]] = []
    videos: Optional[List[VideoResult]] = []
