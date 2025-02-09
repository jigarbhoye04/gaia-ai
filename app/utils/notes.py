from typing import Dict
from fastapi import HTTPException
from app.models.notes_models import NoteModel
from app.utils.embedding_utils import generate_embedding
from app.db.collections import notes_collection
from app.db.db_redis import delete_cache


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
