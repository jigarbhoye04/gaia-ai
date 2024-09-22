from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# DateType could be represented by Python's datetime in the backend
DateType = datetime


# Define the structure for each message
class MessageModel(BaseModel):
    type: str  # "user" or "bot"
    response: str  # Content of the message
    date: Optional[DateType] = None  # Date of the message or empty
    loading: Optional[bool] = False  # Whether the message is still loading
    isImage: Optional[bool] = False  # Whether it's an image message
    imageUrl: Optional[str] = None  # URL for the image
    # Any disclaimer associated with the message
    disclaimer: Optional[str] = None
    # Type of user input (text, file, etc.)
    userinputType: Optional[str] = None
    # Type of file if it contains a file (image, pdf, etc.)
    subtype: Optional[str] = None
    file: Optional[bytes] = None  # Binary data for the file
    filename: Optional[str] = None  # Name of the file, if any


# Define the structure for a single conversation
class ConversationModel(BaseModel):
    conversation_id: str
    description: str = "New Chat"
    messages: List[MessageModel]


# Define the structure for all user conversations
class ConversationHistoryModel(BaseModel):
    user_id: str
    conversation_history: List[ConversationModel]


class UpdateMessagesRequest(BaseModel):
    conversation_id: str
    messages: List[MessageModel]
