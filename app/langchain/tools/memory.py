from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from typing_extensions import Annotated

from app.models.notes_models import NoteModel
from app.utils.notes_utils import insert_note


@tool
async def create_memory(
    plaintext: Annotated[
        str,
        "The plaintext content of the note.",
    ],
    content: Annotated[
        str,
        "The content of the note in Markdown format.",
    ],
    config: RunnableConfig,
) -> str:
    """
    Store a note in memory if the query meets memory creation criteria.
    """
    # Check if the user is authenticated and has a user_id
    if not config.get("metadata").get("user_id"):
        raise ValueError("User ID is required for memory creation.")

    await insert_note(
        NoteModel(content=content, plaintext=plaintext),
        user_id=config.get("metadata").get("user_id"),
        auto_created=True,
    )

    # TODO: Change this to a more appropriate message
    return "Memory has been created successfully. You can now use it in your conversations. You can continue your conversation."
