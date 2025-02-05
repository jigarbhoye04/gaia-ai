from pydantic import BaseModel, Field

# title: str = Field(..., max_length=100, example="Meeting Notes")
# description: str = Field(..., max_length=1000, example="Discuss Q3 planning")


class NoteModel(BaseModel):
    content: str = Field(
        ...,
        max_length=100000,
    )

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
