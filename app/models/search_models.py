from typing import List, Optional, Union
from pydantic import BaseModel, HttpUrl
from datetime import datetime


class URLRequest(BaseModel):
    url: str


class URLResponse(BaseModel):
    title: Union[str, None] = None
    description: Union[str, None] = None
    favicon: Union[str, None] = None
    website_name: Union[str, None] = None
    website_image: Union[str, None] = None
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
    web: Optional[List[WebResult]] = []
    images: Optional[List[ImageResult]] = []
    news: Optional[List[NewsResult]] = []
    videos: Optional[List[VideoResult]] = []


class DeepSearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    full_content: Optional[str] = None
    screenshot_url: Optional[str] = None
    fetch_error: Optional[str] = None
    source: Optional[str] = None
    date: Optional[str] = None


class DeepSearchResponse(BaseModel):
    query: str
    enhanced_results: List[DeepSearchResult]
    screenshots_taken: bool = False
    timestamp: Optional[datetime] = None
    search_id: Optional[str] = None
    user_id: Optional[str] = None
