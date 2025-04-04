import json
from typing import Any
from app.utils.llm_utils import do_prompt_no_stream
from app.prompts.system.notes_prompts import MEMORY_CREATOR


from typing import Dict
from fastapi import HTTPException
from app.models.notes_models import NoteModel
from app.utils.embedding_utils import generate_embedding
from app.db.collections import notes_collection
from app.db.redis import delete_cache


async def insert_note(note: NoteModel, user_id: str, auto_created=False) -> Dict:
    """
    Insert a new note into the database and handle related actions like embedding and cache invalidation.
    """
    # Generate embedding for the note content
    embedding = generate_embedding(note.content)

    # Prepare the note data to insert into the database
    new_note = {
        **note.model_dump(),
        "vector": embedding,
        "user_id": user_id,
        "auto_created": auto_created,
    }

    # Insert the note into the collection
    try:
        result = await notes_collection.insert_one(new_note)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inserting note: {str(e)}")

    # Invalidate cache for all notes
    await delete_cache(f"notes:{user_id}")

    # Return the inserted note with its ID
    return {"id": str(result.inserted_id), **note.model_dump()}


async def should_create_memory(
    message: str,
) -> tuple[bool, None, None] | tuple[bool, Any, Any]:
    try:
        result = await do_prompt_no_stream(
            prompt=f"This is the message: {message}",
            model="@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            system_prompt=MEMORY_CREATOR,
        )

        if isinstance(result, str):
            try:
                result = json.loads(result.strip())
            except json.JSONDecodeError:
                return False, None, None

        elif isinstance(result, dict) and "response" in result:
            try:
                result = json.loads(result["response"].strip())
            except json.JSONDecodeError:
                return False, None, None
        else:
            return False, None, None

        is_memory = result.get("is_memory")

        if isinstance(is_memory, bool):
            return is_memory, result.get("plaintext"), result.get("content")

        return False, None, None

    except Exception:
        return (False, None, None)


async def store_note(query_text: str, user_id: str) -> None:
    """
    Store a note if the query meets memory creation criteria.
    """
    is_memory, plaintext, content = await should_create_memory(query_text)
    if is_memory and content and plaintext:
        await insert_note(
            note=NoteModel(plaintext=plaintext, content=content),
            user_id=user_id,
            auto_created=True,
        )
