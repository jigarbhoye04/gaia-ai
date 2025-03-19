"""
Service module for handling note operations.
"""

from typing import Any

from fastapi import HTTPException, status
from bson import ObjectId
from app.models.notes_models import NoteModel, NoteResponse
from app.db.collections import notes_collection
from app.db.utils import serialize_document
from app.db.db_redis import get_cache, set_cache, delete_cache
from app.utils.notes import insert_note
from app.config.loggers import notes_logger as logger


async def create_note(note: NoteModel, user_id: str) -> dict:
    """
    Create a new note for the specified user.

    Args:
        note (NoteModel): The note data.
        user_id (str): The ID of the authenticated user.

    Returns:
        NoteResponse: The created note.
    """
    logger.info("Creating a new note.")
    response = await insert_note(note, user_id)
    return response


async def get_note(note_id: str, user_id: str) -> dict | Any:
    """
    Retrieve a single note by its ID for the specified user.

    Args:
        note_id (str): The note's ID.
        user_id (str): The ID of the authenticated user.

    Returns:
        NoteResponse: The retrieved note.

    Raises:
        HTTPException: If the note is not found.
    """
    logger.info(f"Retrieving note with id: {note_id} for user: {user_id}")
    cache_key = f"note:{user_id}:{note_id}"
    cached_note = await get_cache(cache_key)
    if cached_note:
        logger.info("Note found in cache.")
        return cached_note

    note = await notes_collection.find_one(
        {"_id": ObjectId(note_id), "user_id": user_id}
    )
    if not note:
        logger.error("Note not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    serialized_note = serialize_document(note)
    await set_cache(cache_key, serialized_note)
    logger.info("Note retrieved from DB and cached.")
    return serialized_note


async def get_all_notes(user_id: str) -> list[dict] | Any:
    """
    Retrieve all notes for the specified user.

    Args:
        user_id (str): The ID of the authenticated user.

    Returns:
        list[NoteResponse]: A list of the user's notes.
    """
    logger.info(f"Retrieving all notes for user: {user_id}")
    cache_key = f"notes:{user_id}"
    cached_notes = await get_cache(cache_key)
    if cached_notes:
        logger.info("All notes found in cache.")
        return cached_notes

    notes = await notes_collection.find({"user_id": user_id}).to_list(length=None)
    serialized_notes = [serialize_document(note) for note in notes]
    await set_cache(cache_key, serialized_notes)
    logger.info("Notes retrieved from DB and cached.")
    return serialized_notes


async def update_note(note_id: str, note: NoteModel, user_id: str) -> dict:
    """
    Update an existing note by its ID for the specified user.

    Args:
        note_id (str): The ID of the note to update.
        note (NoteModel): The updated note data.
        user_id (str): The ID of the authenticated user.

    Returns:
        NoteResponse: The updated note.

    Raises:
        HTTPException: If the note is not found.
    """
    logger.info(f"Updating note with id: {note_id} for user: {user_id}")
    update_data = {k: v for k, v in note.model_dump().items() if v is not None}

    result = await notes_collection.update_one(
        {"_id": ObjectId(note_id), "user_id": user_id}, {"$set": update_data}
    )
    if result.matched_count == 0:
        logger.error("Note not found for update.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    updated_note = await notes_collection.find_one(
        {"_id": ObjectId(note_id), "user_id": user_id}, {"note": 1}
    )
    serialized_note = serialize_document(updated_note)

    # Invalidate caches for this note and for all notes of the user.
    await delete_cache(f"note:{user_id}:{note_id}")
    await delete_cache(f"notes:{user_id}")
    logger.info("Note updated and cache invalidated.")
    return serialized_note


async def delete_note(note_id: str, user_id: str) -> None:
    """
    Delete a note by its ID for the specified user.

    Args:
        note_id (str): The ID of the note to delete.
        user_id (str): The ID of the authenticated user.

    Raises:
        HTTPException: If the note is not found.
    """
    logger.info(f"Deleting note with id: {note_id} for user: {user_id}")
    result = await notes_collection.delete_one(
        {"_id": ObjectId(note_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        logger.error("Note not found for deletion.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    # Invalidate caches for this note and for all notes of the user.
    await delete_cache(f"note:{user_id}:{note_id}")
    await delete_cache(f"notes:{user_id}")
    logger.info("Note deleted and cache invalidated.")


async def create_note_service(note: NoteModel, user_id: str) -> NoteResponse:
    """
    Create a new note for the authenticated user.

    Args:
        note (NoteModel): The note data.
        user_id (str): The ID of the authenticated user.

    Returns:
        NoteResponse: The created note.

    Raises:
        HTTPException: If note creation fails.
    """
    note_data = note.dict()
    note_data["user_id"] = user_id
    try:
        result = await notes_collection.insert_one(note_data)
        created_note = await notes_collection.find_one({"_id": result.inserted_id})
        return NoteResponse(**created_note)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create note")
