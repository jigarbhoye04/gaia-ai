from typing import Optional
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl
from app.db.redis import get_cache, set_cache
from app.middleware.auth import get_current_user
from app.utils.general import get_context_window
from app.utils.logging import get_logger
from app.db.connect import (
    conversations_collection,
    notes_collection,
    serialize_document,
)

router = APIRouter()

logger = get_logger(name="authentication", log_file="auth.log")

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


class URLRequest(BaseModel):
    url: HttpUrl


class URLResponse(BaseModel):
    title: str
    description: str
    website_name: Optional[str] = None
    favicon: Optional[str] = None


async def fetch_url_data(url: str) -> URLResponse:
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

        # Extract website name from Open Graph metadata
        site_name_tag = soup.find("meta", property="og:site_name")
        website_name = site_name_tag["content"] if site_name_tag else None

        metadata = {
            "title": title,
            "description": description,
            "favicon": favicon,
            "website_name": website_name,
        }
        await set_cache(cache_key, metadata, ttl=3600)

        return URLResponse(**metadata)

    except httpx.RequestError as exc:
        logger.error(f"Request error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to fetch the URL."
        )
    except httpx.HTTPStatusError as exc:
        logger.error(f"HTTP error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Page not found."
        )
    except Exception as exc:
        logger.error(f"General error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the request.",
        )


@router.post(
    "/fetch-url-metadata", response_model=URLResponse, status_code=status.HTTP_200_OK
)
async def fetch_url(data: URLRequest):
    return await fetch_url_data(data.url)
