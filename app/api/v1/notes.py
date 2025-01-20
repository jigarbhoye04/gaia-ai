from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.models.notes import NoteCreate, NoteUpdate, NoteResponse
from app.db.connect import notes_collection, serialize_document
from app.db.redis import get_cache, set_cache, delete_cache
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(note: NoteCreate, user: dict = Depends(get_current_user)):
    """
    Create a new note for the authenticated user.
    """
    user_id = user["user_id"]
    new_note = {**note.model_dump(), "user_id": user_id}

    # Ensure `await` for MongoDB operation
    result = await notes_collection.insert_one(new_note)

    # Invalidate cache for all notes
    await delete_cache(f"notes:{user_id}")

    return {"id": str(result.inserted_id), **note.model_dump()}


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(note_id: str, user: dict = Depends(get_current_user)):
    """
    Retrieve a single note by its ID.
    """
    user_id = user["user_id"]

    # Try cache first
    cache_key = f"note:{user_id}:{note_id}"
    cached_note = await get_cache(cache_key)
    if cached_note:
        return cached_note

    # Fetch from database
    note = await notes_collection.find_one(
        {"_id": ObjectId(note_id), "user_id": user_id}
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    serialized_note = serialize_document(note)

    # Cache the note
    await set_cache(cache_key, serialized_note)

    return serialized_note


@router.get("/notes", response_model=list[NoteResponse])
async def get_all_notes(user: dict = Depends(get_current_user)):
    """
    Retrieve all notes for the authenticated user.
    """
    user_id = user["user_id"]

    # Try cache first
    cache_key = f"notes:{user_id}"
    cached_notes = await get_cache(cache_key)
    if cached_notes:
        return cached_notes

    # Fetch from database
    # notes = await notes_collection.find(
    #     {"user_id": user_id}, {"title": 1, "description": 1}
    # ).to_list(length=None)\

    notes = await notes_collection.find(
        {"user_id": user_id},
    ).to_list(length=None)

    serialized_notes = [serialize_document(note) for note in notes]

    # Cache the notes
    await set_cache(cache_key, serialized_notes)

    return serialized_notes


@router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str, note: NoteUpdate, user: dict = Depends(get_current_user)
):
    """
    Update an existing note by its ID.
    """
    user_id = user["user_id"]

    # Prepare update data
    update_data = {k: v for k, v in note.model_dump().items() if v is not None}

    # Update note in database
    result = await notes_collection.update_one(
        {"_id": ObjectId(note_id), "user_id": user_id}, {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    # Fetch updated note
    updated_note = await notes_collection.find_one(
        {"_id": ObjectId(note_id), "user_id": user_id}, {"note": 1}
    )
    serialized_note = serialize_document(updated_note)

    # Invalidate cache for this note and all notes
    await delete_cache(f"note:{user_id}:{note_id}")
    await delete_cache(f"notes:{user_id}")

    return serialized_note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: str, user: dict = Depends(get_current_user)):
    """
    Delete a note by its ID.
    """
    user_id = user["user_id"]

    # Delete note from database
    result = await notes_collection.delete_one(
        {"_id": ObjectId(note_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    # Invalidate cache for this note and all notes
    await delete_cache(f"note:{user_id}:{note_id}")
    await delete_cache(f"notes:{user_id}")

    return
