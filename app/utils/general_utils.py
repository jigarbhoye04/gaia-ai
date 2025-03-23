from datetime import datetime
from typing import Dict
import base64


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
    # Find the query in text (case-insensitive)
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


def transform_gmail_message(msg) -> Dict:
    """Transform Gmail API message to frontend-friendly format while keeping all raw data for debugging."""
    headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}

    timestamp = int(msg.get("internalDate", 0)) / 1000
    time = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M")

    return {
        **msg,
        "id": msg.get("id", ""),
        "from": headers.get("From", ""),
        "subject": headers.get("Subject", ""),
        "time": time,
        "snippet": msg.get("snippet", ""),
        "body": decode_message_body(msg),
        # "raw": msg,
    }


def decode_message_body(msg):
    """Decode the message body from a Gmail API message."""
    payload = msg.get("payload", {})
    parts = payload.get("parts", [])

    # Try to get plain text body
    for part in parts:
        if part.get("mimeType") == "text/plain":
            body = part.get("body", {}).get("data", "")
            return base64.urlsafe_b64decode(
                body.replace("-", "+").replace("_", "/")
            ).decode("utf-8", errors="ignore")

    # Fallback to main body if no plain text part
    if payload.get("body", {}).get("data"):
        body = payload["body"]["data"]
        return base64.urlsafe_b64decode(
            body.replace("-", "+").replace("_", "/")
        ).decode("utf-8", errors="ignore")

    return None
