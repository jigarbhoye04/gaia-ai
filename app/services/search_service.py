"""
Service module for handling search operations and URL metadata fetching.
"""

import httpx
from bs4 import BeautifulSoup
from fastapi import HTTPException, status

from app.config.loggers import search_logger as logger
from app.db.collections import (
    conversations_collection,
    notes_collection,
    search_urls_collection,
)
from app.db.db_redis import get_cache, set_cache
from app.db.utils import serialize_document
from app.models.search_models import URLResponse
from app.utils.general_utils import get_context_window


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
    """Fetch metadata for a URL, with caching and database fallback."""

    cache_key = f"url_metadata:{url}"
    metadata = await get_cache(cache_key) or await search_urls_collection.find_one(
        {"url": url}
    )

    if metadata:
        return URLResponse(**metadata)

    metadata = await scrape_url_metadata(url)

    await search_urls_collection.insert_one(metadata)
    await set_cache(cache_key, metadata, 864000)

    return URLResponse(**metadata)


async def scrape_url_metadata(url: str) -> dict:
    """Scrape metadata from a URL and handle errors gracefully."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        return {
            "title": soup.title.string if soup.title else None,
            "description": (soup.find("meta", attrs={"name": "description"}) or {}).get(
                "content"
            ),
            "favicon": (soup.find("link", rel="icon") or {}).get("href"),
            "website_name": (soup.find("meta", property="og:site_name") or {}).get(
                "content"
            ),
            "url": url,
        }
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        logger.error(f"Error fetching URL metadata: {exc}")
    except Exception as exc:
        logger.error(f"Unexpected error: {exc}")

    return {
        "title": None,
        "description": None,
        "favicon": None,
        "website_name": None,
        "url": url,
    }