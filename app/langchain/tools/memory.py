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
    Create a memory note based on important user input.

    This tool stores user-provided information in memory for long-term reference.
    It should only be used when the input is clearly valuable for future context,
    such as preferences, recurring topics, personal context, or explicit memory requests.

    Use this tool if:
    - The user says something they want you to remember.
    - The information is long-term relevant or likely to come up again.
    - The content defines their preferences, identity, goals, or context.

    Avoid using this tool for:
    - Temporary, task-specific, or one-time information.
    - Casual conversation or unimportant facts.
    - Sensitive information unless explicitly requested.

    Examples:
    - ✅ "My assistant is named GAIA." (Remember)
    - ✅ "I'm building a startup called XYZ." (Remember)
    - ❌ "Send this email." (Don't remember)
    - ❌ "What's the weather today?" (Don't remember)

    Returns:
        A confirmation message once memory has been stored.
    """
    metadata = config.get("metadata") or {}
    user_id = metadata.get("user_id")

    if not isinstance(user_id, str):
        raise ValueError("User ID is required for memory creation.")

    await insert_note(
        NoteModel(content=content, plaintext=plaintext),
        user_id=user_id,
        auto_created=True,
    )

    # TODO: Change this to a more appropriate message
    return "Memory has been created successfully. You can now use it in your conversations. You can continue your conversation."
