from typing import List

import httpx

from app.config.loggers import llm_logger as logger
from app.config.settings import settings


async def extract_last_user_message(messages: List[dict]) -> str:
    """Extract the last user message."""
    return next(
        (msg["content"] for msg in reversed(messages) if msg.get("role") == "user"), ""
    )


async def make_llm_request(payload: dict, http_async_client) -> dict:
    """Helper function to make a request to the LLM API."""
    try:
        response = await http_async_client.post(settings.LLM_URL, json=payload)
        response.raise_for_status()
        return response.json()
    except (httpx.RequestError, ValueError) as e:
        logger.error(f"Request error: {e}")
        return {"error": str(e)}
