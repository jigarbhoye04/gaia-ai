from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Message(BaseModel):
    role: str = Field(description="Role of the message sender (user or assistant)")
    content: str = Field(description="Content of the message")


class AddMemoryInput(BaseModel):
    messages: List[Message] = Field(description="List of messages to add to memory")
    user_id: str = Field(description="ID of the user associated with these messages")
    metadata: Optional[Dict[str, Any]] = Field(
        description="Additional metadata for the messages", default=None
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": "Hi, I'm Alex. I'm a vegetarian and I'm allergic to nuts.",
                        },
                        {
                            "role": "assistant",
                            "content": "Hello Alex! I've noted that you're a vegetarian and have a nut allergy.",
                        },
                    ],
                    "user_id": "alex",
                    "metadata": {"food": "vegan"},
                }
            ]
        }
