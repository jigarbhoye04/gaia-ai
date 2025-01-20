from pydantic import BaseModel, Field
from typing import Optional


class NoteCreate(BaseModel):
    # title: str = Field(..., max_length=100, example="Meeting Notes")
    # description: str = Field(..., max_length=1000, example="Discuss Q3 planning")
    note: str = Field(..., max_length=10000, example="Discuss Q3 planning")


class NoteUpdate(BaseModel):
    # title: Optional[str] = Field(None, max_length=100)
    # description: Optional[str] = Field(None, max_length=1000)
    note: Optional[str] = Field(None, max_length=10000)


class NoteResponse(BaseModel):
    id: str
    # title: str
    # description: str
    note: str
