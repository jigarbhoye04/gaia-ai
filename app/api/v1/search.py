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
    cache_key = f"search_cache:{user_id}:{query}"

    # Check if search results are cached
    cached_results = await get_cache(cache_key)
    if cached_results:
        return {"messages": jsonable_encoder(cached_results)}

    # Search in MongoDB
    try:
        results = await conversations_collection.aggregate(
            [
                {"$match": {"user_id": user_id}},  # Filter by authenticated user
                {"$unwind": "$messages"},  # Unwind the messages array
                {
                    "$match": {"messages.response": {"$regex": query, "$options": "i"}}
                },  # Search for query in content
                {
                    "$project": {
                        "_id": 0,
                        "conversation_id": 1,
                        "message": "$messages",
                        # "response": "$messages.response",
                        # "date": "$messages.createdAt",
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

    # Cache the results
    await set_cache(cache_key, results)

    return {"results": results}
