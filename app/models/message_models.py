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
    fileData: Optional[List[FileData]] = []
    # TODO: Remove fileIds, fileData and messages, we should not get them from the client


class MessageRequest(BaseModel):
    message: str


class MessageRequestPrimary(BaseModel):
    message: str
    conversation_id: str
