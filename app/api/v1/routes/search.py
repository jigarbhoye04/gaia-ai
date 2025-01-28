from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.general import get_context_window
from app.middleware.auth import get_current_user
from app.db.connect import (
    conversations_collection,
    notes_collection,
    serialize_document,
)
# from app.db.redis import set_cache, get_cache

router = APIRouter()


#!TODO implement redis caching


@router.get("/search")
async def search_messages(query: str, user: dict = Depends(get_current_user)):
    """
    Search for messages, conversations, and notes by their description or content.

    Args:
        query (str): The text to search for in messages, conversation descriptions, or notes.

    Returns:
        JSONResponse: Results containing matched messages, conversations, and notes.
    """
    user_id = user["user_id"]

    try:
        results = await conversations_collection.aggregate(
            [
                {"$match": {"user_id": user_id}},
                {
                    "$facet": {
                        "messages": [
                            {"$unwind": "$messages"},
                            {
                                "$match": {
                                    "$or": [
                                        {
                                            "messages.response": {
                                                "$regex": query,
                                                "$options": "i",
                                            }
                                        },
                                        {
                                            "messages.pageFetchURL": {
                                                "$regex": query,
                                                "$options": "i",
                                            }
                                        },
                                    ]
                                }
                            },
                            {
                                "$project": {
                                    "_id": 0,
                                    "conversation_id": 1,
                                    "message": "$messages",
                                }
                            },
                        ],
                        "conversations": [
                            {
                                "$match": {
                                    "description": {"$regex": query, "$options": "i"}
                                }
                            },
                            {
                                "$project": {
                                    "_id": 0,
                                    "conversation_id": 1,
                                    "description": 1,
                                    "conversation": "$conversations",
                                }
                            },
                        ],
                    }
                },
            ]
        ).to_list(None)

        notes_results = await notes_collection.aggregate(
            [
                {
                    "$match": {
                        "user_id": user_id,
                        "plaintext": {"$regex": query, "$options": "i"},
                    }
                },
                {
                    "$project": {
                        "id": {"$toString": "$_id"},
                        "note_id": 1,
                        "plaintext": 1,
                    }
                },
            ]
        ).to_list(None)

        messages = results[0]["messages"] if results else []
        conversations = results[0]["conversations"] if results else []
        notes = notes_results if notes_results else []

        for message in messages:
            message["snippet"] = get_context_window(
                message["message"]["response"], query, chars_before=30
            )

        notes = [
            {
                **serialize_document(note),
                "snippet": get_context_window(
                    note["plaintext"], query, chars_before=30
                ),
            }
            for note in notes_results
        ]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform search: {str(e)}",
        )

    return {"messages": messages, "conversations": conversations, "notes": notes}
