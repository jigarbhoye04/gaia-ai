from pydantic import BaseModel
from typing import List, Optional, Literal, ForwardRef

from app.models.search_models import SearchResults
from app.models.general_models import FileData


class CalIntentOptions(BaseModel):
    summary: Optional[str] = None
    description: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None


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
    intent: Optional[Literal["calendar", "generate_image"]] = None
    calendar_options: Optional[List[CalIntentOptions]] = None
    search_results: Optional[SearchResults] = None


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
