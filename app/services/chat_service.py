from fastapi import HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.encoders import jsonable_encoder
from datetime import datetime, timezone
import asyncio
from bson import ObjectId
from app.db.collections import conversations_collection
from app.utils.search_utils import perform_search, perform_fetch
from app.services.llm_service import LLMService
from app.utils.embedding_utils import search_notes_by_similarity, query_documents
from app.utils.notes_utils import should_create_memory
from app.utils.notes import insert_note
from app.services.text_service import classify_event_type
from app.models.chat_models import ConversationModel, UpdateMessagesRequest
from app.models.notes_models import NoteModel
from app.models.general_models import (
    DescriptionUpdateRequest,
    DescriptionUpdateRequestLLM,
    MessageRequest,
    MessageRequestWithHistory,
)


class ChatService:
    """
    Service class for handling chat and conversation management logic.
    """

    def __init__(self):
        """
        Initialize the ChatService and its dependencies.
        """
        self.llm_service = LLMService()

    async def chat_stream(
        self,
        body: MessageRequestWithHistory,
        background_tasks: BackgroundTasks,
        user: dict,
    ) -> StreamingResponse:
        """
        Stream chat messages in real-time.

        Args:
            body (MessageRequestWithHistory): The request body containing chat history.
            background_tasks (BackgroundTasks): Background tasks handler.
            user (dict): The authenticated user.

        Returns:
            StreamingResponse: The streaming response from the LLM.
        """
        user_id = user.get("user_id")
        intent = None
        llm_model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"

        last_message = body.messages[-1] if body.messages else None
        query_text = (
            last_message["content"].replace("mostRecent: true ", "")
            if last_message
            else ""
        )

        if last_message:
            await self._fetch_notes(last_message, query_text, user)
            await self._fetch_documents(
                last_message, query_text, body.conversation_id, user_id
            )

        type = await classify_event_type(query_text)

        print("this is the type", type)
        if type.get("highest_label") and (type.get("highest_score") >= 0.5):
            match type["highest_label"]:
                case "add to calendar" | "set a reminder":
                    intent = "calendar"
            # case "search web internet":
            #     await do_search(last_message, query_text)
            # case "flowchart":
            #     intent = "flowchart"
            # case "weather":
            #     intent = "weather"

        # Run this in the background (do not await)
        background_tasks.add_task(self._store_note, query_text, user_id)

        if body.pageFetchURL and last_message:
            await self._fetch_webpage(last_message, body.pageFetchURL)

        if body.search_web and last_message:
            await self._do_search(last_message, query_text)

        return StreamingResponse(
            self.llm_service.do_prompt_with_stream(
                messages=jsonable_encoder(body.messages),
                max_tokens=4096,
                intent=intent,
                model=llm_model,
            ),
            media_type="text/event-stream",
        )

    async def chat(self, request: MessageRequest) -> dict:
        """
        Get a chat response.

        Args:
            request (MessageRequest): The chat message request.

        Returns:
            dict: The LLM's response.
        """
        response = await self.llm_service.do_prompt_no_stream(request.message)
        return response

    @staticmethod
    async def create_conversation(conversation: ConversationModel, user: dict) -> dict:
        """
        Create a new conversation.

        Args:
            conversation (ConversationModel): The conversation data.
            user (dict): The authenticated user.

        Returns:
            dict: Details of the created conversation.
        """
        user_id = user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
            )

        created_at = datetime.now(timezone.utc).isoformat()
        conversation_data = {
            "user_id": user_id,
            "conversation_id": conversation.conversation_id,
            "description": conversation.description,
            "messages": [],
            "createdAt": created_at,
        }

        try:
            insert_result = await conversations_collection.insert_one(conversation_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create conversation: {str(e)}",
            )

        if not insert_result.acknowledged:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create conversation",
            )

        # Invalidate the Redis cache for the user asynchronously.
        # asyncio.create_task(delete_cache(f"conversations_cache:{user_id}"))

        return {
            "conversation_id": conversation.conversation_id,
            "user_id": user_id,
            "createdAt": created_at,
            "detail": "Conversation created successfully",
        }

    @staticmethod
    async def get_conversations(user: dict, page: int = 1, limit: int = 10) -> dict:
        """
        Fetch paginated conversations for the authenticated user, always including starred conversations.

        Starred conversations (where "starred": True) are fetched in full (without pagination)
        so that every starred conversation is always included in the result. The non-starred
        conversations are fetched using the provided page and limit.

        Returns:
            dict: A dictionary containing:
                - "conversations": Combined list of starred and paginated non-starred conversation documents.
                - "total": Total number of conversations (starred + non-starred).
                - "page": The current page number for non-starred conversations.
                - "limit": Number of non-starred conversations per page.
                - "total_pages": Total number of pages available for non-starred conversations.
        """
        user_id = user["user_id"]

        # Shared projection to fetch only needed fields.
        projection = {
            "_id": 1,
            "user_id": 1,
            "conversation_id": 1,
            "description": 1,
            "starred": 1,
            "createdAt": 1,
        }

        # Filter for starred conversations.
        starred_filter = {"user_id": user_id, "starred": True}

        # Filter for non-starred conversations: either the "starred" field does not exist or is False.
        non_starred_filter = {
            "user_id": user_id,
            "$or": [{"starred": {"$exists": False}}, {"starred": False}],
        }

        # Calculate the number of documents to skip for pagination (applied to non-starred conversations only).
        skip = (page - 1) * limit

        # Run the three database operations concurrently.
        starred_future = (
            conversations_collection.find(starred_filter, projection)
            .sort("createdAt", -1)
            .to_list(None)
        )
        non_starred_count_future = conversations_collection.count_documents(
            non_starred_filter
        )
        non_starred_future = (
            conversations_collection.find(non_starred_filter, projection)
            .sort("createdAt", -1)
            .skip(skip)
            .limit(limit)
            .to_list(limit)
        )

        (
            starred_conversations,
            non_starred_count,
            non_starred_conversations,
        ) = await asyncio.gather(
            starred_future, non_starred_count_future, non_starred_future
        )

        # Helper function to convert ObjectId to string.
        def convert_ids(conversations):
            for conv in conversations:
                conv["_id"] = str(conv["_id"])
            return conversations

        starred_conversations = convert_ids(starred_conversations)
        non_starred_conversations = convert_ids(non_starred_conversations)

        # Combine starred and non-starred results.
        combined_conversations = starred_conversations + non_starred_conversations

        # Total count: starred count + non-starred count.
        total = len(starred_conversations) + non_starred_count

        # Total pages based on non-starred conversations only.
        total_pages = (
            (non_starred_count + limit - 1) // limit if non_starred_count > 0 else 1
        )

        result = {
            "conversations": combined_conversations,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        }

        return result

    @staticmethod
    async def get_conversation(conversation_id: str, user: dict) -> dict:
        """
        Fetch a specific conversation by ID.

        Args:
            conversation_id (str): The conversation ID.
            user (dict): The authenticated user.

        Returns:
            dict: The conversation details.
        """
        user_id = user.get("user_id")
        conversation = await conversations_collection.find_one(
            {"user_id": user_id, "conversation_id": conversation_id}
        )

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found or does not belong to the user",
            )

        conversation["_id"] = str(conversation["_id"])
        return conversation

    @staticmethod
    async def update_messages(request: UpdateMessagesRequest, user: dict) -> dict:
        """
        Add messages to an existing conversation.

        Args:
            request (UpdateMessagesRequest): The update messages request.
            user (dict): The authenticated user.

        Returns:
            dict: Confirmation of the update.
        """
        user_id = user.get("user_id")
        conversation_id = request.conversation_id

        messages = []
        for message in request.messages:
            message_dict = message.model_dump(exclude={"loading"})
            message_dict = {
                key: value for key, value in message_dict.items() if value is not None
            }
            message_dict.setdefault("message_id", str(ObjectId()))
            messages.append(message_dict)

        update_result = await conversations_collection.update_one(
            {"user_id": user_id, "conversation_id": conversation_id},
            {"$push": {"messages": {"$each": messages}}},
        )

        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found or does not belong to the user",
            )

        return {"conversation_id": conversation_id, "message": "Messages updated"}

    async def update_conversation_description_llm(
        self, conversation_id: str, data: DescriptionUpdateRequestLLM, user: dict
    ) -> dict:
        """
        Update the conversation description using an LLM-generated summary.

        Args:
            conversation_id (str): The conversation ID.
            data (DescriptionUpdateRequestLLM): Data containing the first user message.
            user (dict): The authenticated user.

        Returns:
            dict: Confirmation of the update with the new description.
        """
        user_id = user.get("user_id")
        response = await self.llm_service.do_prompt_no_stream(
            prompt=f"'{data.userFirstMessage}'\nRephrase this text into a succinct topic description (maximum 4 words). Do not answer the message—simply summarize its subject.",
            max_tokens=5,
        )
        description = (response.get("response", "New Chat")).replace('"', "")

        update_result = await conversations_collection.update_one(
            {"user_id": user_id, "conversation_id": conversation_id},
            {"$set": {"description": description}},
        )

        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=404, detail="Conversation not found or update failed"
            )

        # await delete_cache(f"conversations_cache:{user_id}")

        return {
            "message": "Conversation updated successfully",
            "description": description,
        }

    @staticmethod
    async def update_conversation_description(
        conversation_id: str, data: DescriptionUpdateRequest, user: dict
    ) -> dict:
        """
        Update the conversation description.

        Args:
            conversation_id (str): The conversation ID.
            data (DescriptionUpdateRequest): Data containing the new description.
            user (dict): The authenticated user.

        Returns:
            dict: Confirmation of the update with the new description.
        """
        user_id = user.get("user_id")

        update_result = await conversations_collection.update_one(
            {"user_id": user_id, "conversation_id": conversation_id},
            {"$set": {"description": data.description}},
        )

        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=404, detail="Conversation not found or update failed"
            )

        # await delete_cache(f"conversations_cache:{user_id}")

        return {
            "message": "Conversation updated successfully",
            "description": data.description,
        }

    @staticmethod
    async def star_conversation(
        conversation_id: str, starred: bool, user: dict
    ) -> dict:
        """
        Star or unstar a conversation.

        Args:
            conversation_id (str): The conversation ID.
            starred (bool): True to star, False to unstar.
            user (dict): The authenticated user.

        Returns:
            dict: Confirmation message and current starred status.
        """
        user_id = user.get("user_id")
        update_result = await conversations_collection.update_one(
            {"user_id": user_id, "conversation_id": conversation_id},
            {"$set": {"starred": starred}},
        )

        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=404, detail="Conversation not found or update failed"
            )

        # await delete_cache(f"conversations_cache:{user_id}")

        return {"message": "Conversation updated successfully", "starred": starred}

    @staticmethod
    async def delete_all_conversations(user: dict) -> dict:
        """
        Delete all conversations for the authenticated user.

        Args:
            user (dict): The authenticated user.

        Returns:
            dict: Confirmation message.
        """
        user_id = user.get("user_id")
        delete_result = await conversations_collection.delete_many({"user_id": user_id})

        if delete_result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="No conversations found for the user",
            )

        # await delete_cache(f"conversations_cache:{user_id}")

        return {"message": "All conversations deleted successfully"}

    @staticmethod
    async def delete_conversation(conversation_id: str, user: dict) -> dict:
        """
        Delete a specific conversation by ID.

        Args:
            conversation_id (str): The conversation ID.
            user (dict): The authenticated user.

        Returns:
            dict: Confirmation message with the conversation ID.
        """
        user_id = user.get("user_id")
        delete_result = await conversations_collection.delete_one(
            {"user_id": user_id, "conversation_id": conversation_id}
        )

        if delete_result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found or does not belong to the user",
            )

        # await delete_cache(f"conversations_cache:{user_id}")

        return {
            "message": "Conversation deleted successfully",
            "conversation_id": conversation_id,
        }

    @staticmethod
    async def pin_message(
        conversation_id: str, message_id: str, pinned: bool, user: dict
    ) -> dict:
        """
        Pin or unpin a message within a conversation.

        Args:
            conversation_id (str): The conversation ID.
            message_id (str): The message ID.
            pinned (bool): True to pin, False to unpin.
            user (dict): The authenticated user.

        Returns:
            dict: Confirmation message with the new pinned status.
        """
        user_id = user.get("user_id")
        conversation = await conversations_collection.find_one(
            {"user_id": user_id, "conversation_id": conversation_id}
        )

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        messages = conversation.get("messages", [])
        target_message = next(
            (msg for msg in messages if msg.get("message_id") == message_id), None
        )

        if not target_message:
            raise HTTPException(
                status_code=404, detail="Message not found in conversation"
            )

        update_result = await conversations_collection.update_one(
            {
                "user_id": user_id,
                "conversation_id": conversation_id,
                "messages.message_id": message_id,
            },
            {"$set": {"messages.$.pinned": pinned}},
        )

        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=404, detail="Message not found or update failed"
            )

        response_message = (
            f"Message with ID {message_id} pinned successfully"
            if pinned
            else f"Message with ID {message_id} unpinned successfully"
        )

        return {"message": response_message, "pinned": pinned}

    @staticmethod
    async def get_starred_messages(user: dict) -> dict:
        """
        Fetch all pinned messages across all conversations for the authenticated user.

        Args:
            user (dict): The authenticated user.

        Returns:
            dict: Pinned messages across conversations.
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

    # --------------------------
    # Internal helper functions
    # --------------------------

    @staticmethod
    async def _do_search(last_message: dict, query_text: str) -> None:
        """
        Perform a web search and append relevant context to the last message.

        Args:
            last_message (dict): The last message in the conversation.
            query_text (str): The query text for search.
        """
        search_result = await perform_search(query=query_text, count=5)
        last_message["content"] += (
            f"\nRelevant context using GAIA web search: {search_result}. Use citations and references for all the content. "
            "Add citations after each line where something is cited like [1] but the link should be in markdown (like this: [[1]](https://example.com))."
        )

    @staticmethod
    async def _fetch_webpage(last_message: dict, url: str) -> None:
        """
        Fetch a webpage and append its content to the last message.

        Args:
            last_message (dict): The last message in the conversation.
            url (str): The URL of the webpage to fetch.
        """
        page_content = await perform_fetch(url)
        last_message["content"] += (
            f"\nRelevant context from the fetched URL: {page_content}"
        )

    @staticmethod
    async def _store_note(query_text: str, user_id: str) -> None:
        """
        Store a note if the query meets memory creation criteria.

        Args:
            query_text (str): The query text.
            user_id (str): The ID of the user.
        """
        is_memory, plaintext, content = await should_create_memory(query_text)
        if is_memory and content and plaintext:
            await insert_note(
                note=NoteModel(plaintext=plaintext, content=content),
                user_id=user_id,
                auto_created=True,
            )

    @staticmethod
    async def _fetch_notes(last_message: dict, query_text: str, user: dict) -> None:
        """
        Fetch similar notes and append their content to the last message.

        Args:
            last_message (dict): The last message in the conversation.
            query_text (str): The query text.
            user (dict): The authenticated user.
        """
        notes = await search_notes_by_similarity(
            input_text=query_text, user_id=user.get("user_id")
        )
        if notes:
            last_message["content"] = (
                f"User: {last_message['content']} \n System: The user has the following notes: "
                f"{'- '.join(notes)} (Fetched from the Database). Only mention these notes when relevant to the conversation."
            )

    @staticmethod
    async def _fetch_documents(
        last_message: dict, query_text: str, conversation_id: str, user_id: str
    ) -> None:
        """
        Fetch documents related to the query and append their content to the last message.

        Args:
            last_message (dict): The last message in the conversation.
            query_text (str): The query text.
            conversation_id (str): The conversation ID.
            user_id (str): The ID of the user.
        """
        documents = await query_documents(query_text, conversation_id, user_id)
        if not documents or len(documents) <= 0:
            return

        content = [document["content"] for document in documents]
        titles = [document["title"] for document in documents]

        prompt = (
            f"Question: {last_message['content']}\n\n"
            f"Context from document files uploaded by the user:\n"
            f"{{'document_names': {titles}, 'content': {content}}}"
        )
        last_message["content"] = prompt


chat_service = ChatService()
