from typing import Optional

from pydantic import BaseModel, Field


class DocumentPageModel(BaseModel):
    page_number: int = Field(
        ...,
        gt=0,
    )
    base64: str = Field(...)
    # Other metadata fields can be added here


class DocumentSummaryModel(BaseModel):
    image: Optional[DocumentPageModel] = None
    summary: str = Field(
        ...,
        max_length=100000,
    )
