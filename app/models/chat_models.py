from typing import List, Literal, Optional

from pydantic import BaseModel

from app.models.general_models import FileData
from app.models.search_models import DeepSearchResults, SearchResults
from app.models.weather_models import WeatherData
from app.models.calendar_models import EventCreateRequest


class MessageModel(BaseModel):
    type: str  # "user" or "bot"
    response: str  # Content of the message
    date: Optional[str] = None  # Date of the message or empty
    imagePrompt: Optional[str] = None  # The user prompt for the image
    improvedImagePrompt: Optional[str] = None  # Improved user prompt for the image
    searchWeb: Optional[bool] = False  # Whether it's a web search request
    deepSearchWeb: Optional[bool] = False  # Whether it's a deep search request
    imageUrl: Optional[str] = None  # URL for the image
    pageFetchURLs: Optional[List] = []
    # Any disclaimer associated with the message
    disclaimer: Optional[str] = None
    # Type of file if it contains a file (image, pdf, etc.)
    subtype: Optional[str] = None
    file: Optional[bytes] = None  # Binary data for the file
    filename: Optional[str] = None  # Name of the file, if any
    filetype: Optional[str] = None  # Name of the file, if any
    message_id: Optional[str] = None  # Message ID
    fileIds: Optional[List[str]] = []  # List of file IDs associated with the message
    fileData: Optional[List[FileData]] = []  # Complete file metadata
    intent: Optional[Literal["calendar", "generate_image", "weather"]] = None
    calendar_options: Optional[List[EventCreateRequest]] = None
    search_results: Optional[SearchResults] = None
    deep_search_results: Optional[DeepSearchResults] = None  # Results from deep search
    weather_data: Optional[WeatherData] = None  # Weather data from OpenWeatherMap API


class ConversationModel(BaseModel):
    conversation_id: str
    description: str = "New Chat"


class UpdateMessagesRequest(BaseModel):
    conversation_id: str
    messages: List[MessageModel]


class StarredUpdate(BaseModel):
    starred: bool


class PinnedUpdate(BaseModel):
    pinned: bool
