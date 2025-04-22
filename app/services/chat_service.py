import json
from typing import AsyncGenerator

from fastapi import HTTPException

from app.db.collections import conversations_collection
from app.langchain.agent import call_agent
from app.models.general_models import (
    MessageRequestWithHistory,
)
from app.utils.chat_utils import create_conversation


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

    if body.conversation_id is None:
        last_message = body.messages[-1] if body.messages else None

        conversation = await create_conversation(last_message=last_message, user=user)

        yield f"""data: {
            json.dumps(
                {
                    "conversation_id": conversation.get("conversation_id"),
                    "conversation_description": conversation.get(
                        "description", "New Chat"
                    ),
                }
            )
        }\n\n"""

    # TODO: FETCH NOTES AND FILES AND USE THEM

    async for chunk in call_agent(
        request=body,
        user=user,
        conversation_id=body.conversation_id,
        access_token=user.get("access_token"),
    ):
        yield chunk

    # TODO: Update the conversation with the new messages here instead of from the frontend
    # background_tasks.add_task(
    #     update_messages,
    #     UpdateMessagesRequest(
    #         conversation_id=body.conversation_id,
    #         new_messages=[
    #             ConversationModel(
    #                 conversation_id=body.conversation_id,
    #                 description="New Chat",
    #             )
    #         ],
    #     ),
    #     user=user,
    # )


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
