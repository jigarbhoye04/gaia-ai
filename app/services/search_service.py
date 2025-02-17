"""
Service module for handling search operations and URL metadata fetching.
"""

import httpx
from bs4 import BeautifulSoup
from fastapi import HTTPException, status
from app.db.db_redis import get_cache, set_cache
from app.db.utils import serialize_document
from app.models.search_models import URLResponse
from app.utils.general_utils import get_context_window
from app.utils.logging_util import get_logger
from app.db.collections import conversations_collection, notes_collection

# Global logger instance for this module.
logger = get_logger(name="search", log_file="search.log")


async def search_messages(query: str, user_id: str) -> dict:
    """
    Search for messages, conversations, and notes for a given user that match the query.

    Args:
        query (str): The search text.
        user_id (str): The ID of the authenticated user.

    Returns:
        dict: A dictionary containing lists of matched messages, conversations, and notes.

    Raises:
        HTTPException: If an error occurs during the search process.
    """
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
                                    "description": {"$regex": query, "$options": "i"},
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

        for message in messages:
            message["snippet"] = get_context_window(
                message["message"]["response"], query, chars_before=30
            )

        notes_with_snippets = [
            {
                **serialize_document(note),
                "snippet": get_context_window(
                    note["plaintext"], query, chars_before=30
                ),
            }
            for note in notes_results
        ]

        return {
            "messages": messages,
            "conversations": conversations,
            "notes": notes_with_snippets,
        }
    except Exception as e:
        logger.error(f"Error in search_messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform search: {str(e)}",
        )


async def fetch_url_metadata(url: str) -> URLResponse:
    """
    Fetch metadata from the provided URL, including title, description, favicon, and website name.
    If fetching fails, store fallback (empty) metadata in the cache to prevent redundant API calls.

    Args:
        url (str): The URL to fetch metadata from.

    Returns:
        URLResponse: An object containing the URL metadata.
    """
    cache_key = f"url_metadata:{str(url)}"
    cached_data = await get_cache(cache_key)

    if cached_data:
        return URLResponse(**cached_data)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(str(url))
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        title = soup.title.string if soup.title else None
        description_tag = soup.find("meta", attrs={"name": "description"})
        description = description_tag["content"] if description_tag else None
        favicon_tag = soup.find("link", rel="icon")
        favicon = favicon_tag["href"] if favicon_tag else None

        # Extract website name from Open Graph metadata.
        site_name_tag = soup.find("meta", property="og:site_name")
        website_name = site_name_tag["content"] if site_name_tag else None

        metadata = {
            "title": title,
            "description": description,
            "favicon": favicon,
            "website_name": website_name,
        }
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        logger.error(f"Error fetching URL metadata: {exc}")
        metadata = {
            "title": None,
            "description": None,
            "favicon": None,
            "website_name": None,
        }
    except Exception as exc:
        logger.error(f"Unexpected error: {exc}")
        metadata = {
            "title": None,
            "description": None,
            "favicon": None,
            "website_name": None,
        }

    await set_cache(
        cache_key,
        metadata,
    )
    return URLResponse(**metadata)
