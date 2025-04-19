from typing import AsyncGenerator

from fastapi.encoders import jsonable_encoder

from app.db.collections import conversations_collection
from app.models.general_models import (
    MessageRequestWithHistory,
)
from app.services.langchain_service import do_prompt_with_stream
from fastapi import HTTPException


async def chat_stream(
    body: MessageRequestWithHistory,
    user: dict,
) -> AsyncGenerator:
    """
    Stream chat messages in real-time using the plug-and-play pipeline.

    This function coordinates the processing of chat messages through a pipeline,
    including optional web search, deep internet search, document fetching,
    and other enhancements before sending to the language model.

    Args:
        body (MessageRequestWithHistory): Contains the message, conversation ID, message history, and optional flags
        user (dict): User information from authentication

    Returns:
        StreamingResponse: A streaming response containing the LLM's generated content
    """
    # last_message = body.messages[-1] if body.messages else None
    # context = {
    #     "user_id": user.get("user_id"),
    #     "conversation_id": body.conversation_id,
    #     "query_text": last_message.get("content", "")
    #     if last_message is not None
    #     else "",
    #     "last_message": last_message,
    #     "body": body,
    #     "user": user,
    #     "messages": jsonable_encoder(body.messages),
    #     "search_web": body.search_web,
    #     "deep_search": body.deep_search,
    #     "pageFetchURLs": body.pageFetchURLs,
    #     "fileIds": body.fileIds,
    # }
    # context["messages"][-1] = context["last_message"]

    # TODO: FETCH NOTES AND FILES AND USE THEM

    async for chunk in do_prompt_with_stream(
        messages=jsonable_encoder(body.messages),
        user_id=user.get("user_id"),
        conversation_id=body.conversation_id,
        access_token=user.get("access_token"),
    ):
        yield chunk


async def get_starred_messages(user: dict) -> dict:
    """
    Fetch all pinned messages across all conversations for the authenticated user.
    """
    user_id = user.get("user_id")

    results = await conversations_collection.aggregate(
        [
            {"$match": {"user_id": user_id}},
            {"$unwind": "$messages"},
            {"$match": {"messages.pinned": True}},
            {"$project": {"_id": 0, "conversation_id": 1, "message": "$messages"}},
        ]
    ).to_list(None)

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No pinned messages found across any conversation",
        )

    return {"results": results}
