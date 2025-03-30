from typing import Dict, List, Literal, Optional, Union

from pydantic import BaseModel

from app.models.general_models import FileData
from app.models.search_models import SearchResults


class WeatherLocation(BaseModel):
    city: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None


class WeatherMain(BaseModel):
    temp: float
    feels_like: float
    temp_min: float
    temp_max: float
    pressure: int
    humidity: int


class WeatherWind(BaseModel):
    speed: float
    deg: int


class WeatherClouds(BaseModel):
    all: int


class WeatherSys(BaseModel):
    country: Optional[str] = None
    sunrise: int
    sunset: int


class WeatherCondition(BaseModel):
    id: int
    main: str
    description: str
    icon: str


class ForecastDayWeather(BaseModel):
    main: str
    description: str
    icon: str


class ForecastDay(BaseModel):
    date: str
    timestamp: int
    temp_min: float
    temp_max: float
    humidity: int
    weather: ForecastDayWeather


class WeatherData(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    cod: Optional[Union[int, str]] = None
    coord: Optional[Dict[str, float]] = None
    weather: Optional[List[WeatherCondition]] = None
    base: Optional[str] = None
    main: Optional[WeatherMain] = None
    visibility: Optional[int] = None
    wind: Optional[WeatherWind] = None
    clouds: Optional[WeatherClouds] = None
    dt: Optional[int] = None
    sys: Optional[WeatherSys] = None
    timezone: Optional[int] = None
    location: Optional[WeatherLocation] = None
    forecast: Optional[List[ForecastDay]] = None  # 5-day forecast data


class CalIntentOptions(BaseModel):
    summary: Optional[str] = None
    description: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None


class DeepSearchResult(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    snippet: Optional[str] = None
    full_content: Optional[str] = None
    fetch_error: Optional[str] = None
    screenshot_url: Optional[str] = None


class DeepSearchResultsMedata(BaseModel):
    elapsed_time: Optional[float] = None
    query: Optional[str] = None
    total_content_size: Optional[int] = None


class DeepSearchResults(BaseModel):
    original_search: Optional[SearchResults] = None
    enhanced_results: Optional[List[DeepSearchResult]] = None
    metadata: Optional[DeepSearchResultsMedata] = None
    query: Optional[str] = None
    error: Optional[str] = None


# Define the structure for each message
class MessageModel(BaseModel):
    type: str  # "user" or "bot"
    response: str  # Content of the message
    date: Optional[str] = None  # Date of the message or empty
    imagePrompt: Optional[str] = None  # The user prompt for the image
    improvedImagePrompt: Optional[str] = None  # Improved user prompt for the image
    loading: Optional[bool] = False  # Whether the message is still loading
    isImage: Optional[bool] = False  # Whether it's an image message
    searchWeb: Optional[bool] = False  # Whether it's a web search request
    deepSearchWeb: Optional[bool] = False  # Whether it's a deep search request
    imageUrl: Optional[str] = None  # URL for the image
    pageFetchURLs: Optional[List] = []
    # Any disclaimer associated with the message
    disclaimer: Optional[str] = None
    # Type of user input (text, file, etc.)
    userinputType: Optional[str] = None
    # Type of file if it contains a file (image, pdf, etc.)
    subtype: Optional[str] = None
    file: Optional[bytes] = None  # Binary data for the file
    filename: Optional[str] = None  # Name of the file, if any
    filetype: Optional[str] = None  # Name of the file, if any
    message_id: Optional[str] = None  # Message ID
    fileIds: Optional[List[str]] = []  # List of file IDs associated with the message
    fileData: Optional[List[FileData]] = []  # Complete file metadata
    intent: Optional[Literal["calendar", "generate_image", "weather"]] = None
    calendar_options: Optional[List[CalIntentOptions]] = None
    search_results: Optional[SearchResults] = None
    deep_search_results: Optional[DeepSearchResults] = None  # Results from deep search
    deep_search_error: Optional[str] = None  # Errors from deep search
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
