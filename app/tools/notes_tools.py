from langchain_core.tools import tool, InjectedToolArg
from typing_extensions import Annotated
from app.utils.notes_utils import insert_note
from app.models.notes_models import NoteModel


@tool
def create_memory(
    plaintext: str, content: str, user_id: Annotated[str, InjectedToolArg]
) -> None:
    """
    Store a note in memory if the query meets memory creation criteria.
    """
    insert_note(
        NoteModel(content=content, plaintext=plaintext),
        user_id=user_id,
        auto_created=True,
    )
