from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from app.db.connect import conversations_collection
from app.db.redis import set_cache, get_cache
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/search/messages")
async def search_messages(query: str, user: dict = Depends(get_current_user)):
    """
    Search for messages containing specific text in the conversations collection.

    Args:
        query (str): The text to search for in messages.

    Returns:
        JSONResponse: Messages matching the query.
    """
    user_id = user["user_id"]

    try:
        results = await conversations_collection.aggregate(
            [
                {"$match": {"user_id": user_id}},
                {"$unwind": "$messages"},
                {"$match": {"messages.response": {"$regex": query, "$options": "i"}}},
                {
                    "$project": {
                        "_id": 0,
                        "conversation_id": 1,
                        "message": "$messages",
                    }
                },
            ]
        ).to_list(None)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform search: {str(e)}",
        )

    if not results:
        results = []

    return {"results": results}
