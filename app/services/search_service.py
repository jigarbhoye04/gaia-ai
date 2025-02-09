"""
Service module for search operations and URL metadata fetching.
"""

import httpx
from bs4 import BeautifulSoup
from fastapi import HTTPException, status
from app.db.redis import get_cache, set_cache
from app.db.utils import serialize_document
from app.models.search_models import URLResponse
from app.utils.general_utils import get_context_window
from app.utils.logging import get_logger
from app.db.collections import (
    conversations_collection,
    notes_collection,
)


class Search:
    """
    A utility class to handle search operations and fetching URL metadata.
    """

    def __init__(self) -> None:
        """
        Initialize the Search class and configure its logger.
        """
        self.logger = get_logger(name="search", log_file="search.log")

    async def search_messages(self, query: str, user_id: str) -> dict:
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
                                        "description": {
                                            "$regex": query,
                                            "$options": "i",
                                        }
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
            self.logger.error(f"Error in search_messages: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to perform search: {str(e)}",
            )

    async def fetch_url_metadata(self, url: str) -> URLResponse:
        """
        Fetch metadata from the provided URL, including title, description, favicon, and website name.

        Args:
            url (str): The URL to fetch metadata from.

        Returns:
            URLResponse: An object containing the URL metadata.

        Raises:
            HTTPException: If the URL data cannot be fetched or processed.
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
            self.logger.error(f"Request error: {exc}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch the URL.",
            )
        except httpx.HTTPStatusError as exc:
            self.logger.error(f"HTTP error: {exc}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Page not found."
            )
        except Exception as exc:
            self.logger.error(f"General error: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while processing the request.",
            )
