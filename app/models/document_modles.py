from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    conversation_id: str
    message: str


class DocumentQueryRequest(BaseModel):
    message: str
    conversation_id: str


class DocumentUploadRequest(BaseModel):
    conversation_id: str
