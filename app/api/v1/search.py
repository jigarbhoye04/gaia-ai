from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from app.db.connect import conversations_collection
from app.db.redis import set_cache, get_cache
from app.middleware.auth import get_current_user

router = APIRouter()


def get_context_window(
    text: str, query: str, chars_before: int = 15, chars_after: int = 30
) -> str:
    """
    Get text window around the search query with specified characters before and after.

    Args:
        text (str): Full text to search in
        query (str): Search term to find
        chars_around (int): Number of characters to include before and after match

    Returns:
        str: Context window containing the match with surrounding text
    """
    # Find the query in text (case insensitive)
    query_lower = query.lower()
    text_lower = text.lower()

    # Find the start position of the query
    start_pos = text_lower.find(query_lower)
    if start_pos == -1:
        return ""

    # Calculate window boundaries
    window_start = max(0, start_pos - chars_before)
    window_end = min(len(text), start_pos + len(query) + chars_after)

    # Get the context window
    context = text[window_start:window_end]

    # Add ellipsis if we're not at the start/end of the text
    if window_start > 0:
        context = "..." + context
    if window_end < len(text):
        context = context + "..."

    return context


@router.get("/search/messages")
async def search_messages(query: str, user: dict = Depends(get_current_user)):
    """
    Search for messages and return both context snippets and full messages.

    Args:
        query (str): The text to search for in messages.

    Returns:
        JSONResponse: Message snippets and full messages containing the query.
    """
    user_id = user["user_id"]

    try:
        # First get matching messages from MongoDB
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

        # Process each result to add the context snippet
        for result in results:
            result["snippet"] = get_context_window(
                result["message"]["response"], query, chars_before=30
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform search: {str(e)}",
        )

    if not results:
        results = []

    return {"results": results}
