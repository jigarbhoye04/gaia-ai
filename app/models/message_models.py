from typing import List, Optional

from pydantic import BaseModel
from typing_extensions import TypedDict


class MessageDict(TypedDict):
    role: str
    content: str


class FileData(BaseModel):
    fileId: str
    url: str
    filename: str
    description: Optional[str] = None
    type: Optional[str] = "file"
    message: Optional[str] = "File uploaded successfully"


class MessageRequestWithHistory(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    messages: List[MessageDict]
    search_web: Optional[bool] = False
    deep_search: Optional[bool] = False
    pageFetchURLs: Optional[List[str]] = []
    fileIds: Optional[List[str]] = []
    fileData: Optional[
        List[FileData]
    ] = []  # TODO: Remove this field, we should not request it from the frontend


class MessageRequest(BaseModel):
    message: str


class MessageRequestPrimary(BaseModel):
    message: str
    conversation_id: str
