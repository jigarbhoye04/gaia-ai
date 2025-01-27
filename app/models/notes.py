from pydantic import BaseModel, Field


class NoteModel(BaseModel):
    # title: str = Field(..., max_length=100, example="Meeting Notes")
    # description: str = Field(..., max_length=1000, example="Discuss Q3 planning")

    content: str = Field(
        ...,
        max_length=100000,
    )  # This field will have content in the form of HTML

    plaintext: str = Field(
        ...,
        max_length=100000,
    )


class NoteResponse(BaseModel):
    id: str
    content: str
    plaintext: str
    user_id: str | None = None
    title: str | None = None
    description: str | None = None
