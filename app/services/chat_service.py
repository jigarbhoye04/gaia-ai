import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List

from bson import ObjectId
from fastapi import BackgroundTasks, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse

from app.config.loggers import chat_logger as logger
from app.db.collections import conversations_collection
from app.models.chat_models import ConversationModel, UpdateMessagesRequest
from app.models.general_models import (
    DescriptionUpdateRequest,
    DescriptionUpdateRequestLLM,
    MessageRequest,
    MessageRequestWithHistory,
)
from app.models.notes_models import NoteModel
from app.prompts.user.chat_prompts import (
    CONVERSATION_DESCRIPTION_GENERATOR,
    DEEP_SEARCH_CONTEXT_TEMPLATE,
    DOCUMENTS_CONTEXT_TEMPLATE,
    NOTES_CONTEXT_TEMPLATE,
    PAGE_CONTENT_TEMPLATE,
    SEARCH_CONTEXT_TEMPLATE,
)
from app.services.image_service import image_service
from app.services.llm_service import (
    do_prompt_no_stream,
    do_prompt_with_stream,
)
from app.services.pipeline_service import Pipeline
from app.services.search_service import perform_deep_search
from app.services.text_service import classify_event_type
from app.utils.embedding_utils import query_documents, search_notes_by_similarity
from app.utils.notes import insert_note
from app.utils.notes_utils import should_create_memory
from app.utils.search_utils import (
    extract_urls_from_text,
    format_results_for_llm,
    perform_fetch,
    perform_search,
)


async def do_deep_search(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform a deep internet search by fetching and processing web content from search results.

    This pipeline step:
    1. Searches the web for relevant content based on the user's query
    2. Fetches the full content of the top search results concurrently
    3. Converts the content to markdown format for better LLM processing
    4. Adds the enhanced content to the message context with appropriate formatting

    Args:
        context (Dict[str, Any]): The pipeline context containing user query and message data

    Returns:
        Dict[str, Any]: The updated context with deep search results added
    """
    start_time = time.time()

    if context["deep_search"] and context["last_message"]:
        query_text = context["query_text"]
        logger.info(f"Starting deep search pipeline step for query: {query_text}")

        try:
            # Get deep search results independently of regular search
            deep_search_results = await perform_deep_search(
                query=query_text, max_results=3
            )

            # Extract enhanced results with full content
            enhanced_results = deep_search_results.get("enhanced_results", [])
            metadata = deep_search_results.get("metadata", {})

            if enhanced_results:
                # Format the results for the LLM with better structure
                formatted_content = "## Deep Search Results\n\n"

                for i, result in enumerate(enhanced_results, 1):
                    title = result.get("title", "No Title")
                    url = result.get("url", "#")
                    snippet = result.get("snippet", "No snippet available")
                    full_content = result.get("full_content", "")
                    # from_cache = result.get("from_cache", False)
                    fetch_error = result.get("fetch_error", None)

                    formatted_content += f"### {i}. {title}\n"
                    formatted_content += f"**URL**: {url}\n\n"

                    if fetch_error:
                        formatted_content += (
                            f"**Note**: Could not fetch full content: {fetch_error}\n\n"
                        )
                        formatted_content += f"**Summary**: {snippet}\n\n"
                    else:
                        formatted_content += f"**Summary**: {snippet}\n\n"
                        formatted_content += "**Content**:\n"
                        formatted_content += full_content + "\n\n"

                    formatted_content += "---\n\n"

                # Add the formatted content to the context using the template
                context["last_message"]["content"] += (
                    DEEP_SEARCH_CONTEXT_TEMPLATE.format(
                        formatted_content=formatted_content
                    )
                )

                # Store relevant metadata in context for potential later use
                context["deep_search_results"] = {
                    "query": query_text,
                    "result_count": len(enhanced_results),
                    "content_size": metadata.get("total_content_size", 0),
                    "search_time": metadata.get("elapsed_time", 0),
                }

                elapsed_time = time.time() - start_time
                logger.info(
                    f"Deep search pipeline step completed in {elapsed_time:.2f} seconds"
                )
            else:
                logger.info("No enhanced results from deep search")
                context["last_message"]["content"] += (
                    "\n\nNo detailed information found from deep search."
                )
        except Exception as e:
            logger.error(f"Error in deep search pipeline step: {e}", exc_info=True)
            # Don't fail the whole pipeline if deep search fails
            context["deep_search_error"] = str(e)
            context["last_message"]["content"] += (
                "\n\nError performing deep search, falling back to standard results."
            )

    return context


async def do_search(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform a web search and append relevant context to the last message.

    This pipeline step:
    1. Validates if search is enabled and a query is available
    2. Executes a web search with the query
    3. Formats the results in a structured way for the LLM
    4. Adds the search results to the message context

    Args:
        context (Dict[str, Any]): The pipeline context containing user query and message data

    Returns:
        Dict[str, Any]: The updated context with search results added
    """
    start_time = time.time()

    # Only perform search if search_web flag is enabled, deep search is disabled and we have a message
    if context["search_web"] and context["last_message"] and not context["deep_search"]:
        query_text = context["query_text"]
        logger.info(f"Starting web search for query: {query_text}")

        try:
            # Configure search parameters based on query characteristics
            # For longer queries, we might want fewer results to keep context manageable
            result_count = 5
            if len(query_text) > 100:
                result_count = 3

            # Perform the search with error handling
            search_results = await perform_search(query=query_text, count=result_count)

            # Extract different result types
            web_results = search_results.get("web", [])
            news_results = search_results.get("news", [])

            # Format results with better structure
            formatted_results = ""

            if web_results:
                formatted_results += (
                    format_results_for_llm(web_results, result_type="Web Results")
                    + "\n\n"
                )

            if news_results:
                formatted_results += format_results_for_llm(
                    news_results, result_type="News Results"
                )

            # Handle case where no results were found
            if not formatted_results.strip():
                formatted_results = "No relevant search results found for your query."

            # Add the formatted search results to the context
            context["last_message"]["content"] += SEARCH_CONTEXT_TEMPLATE.format(
                formatted_results=formatted_results
            )

            # Store the raw results in context for potential later use
            context["search_results"] = search_results

            elapsed_time = time.time() - start_time
            logger.info(
                f"Web search completed in {elapsed_time:.2f} seconds. Found {len(web_results)} web results and {len(news_results)} news results."
            )

        except Exception as e:
            logger.error(f"Error in web search: {e}", exc_info=True)
            # Add a note about the search failure to the message
            context["search_error"] = str(e)
            context["last_message"]["content"] += (
                "\n\nError performing web search. Please try again later."
            )

    return context


async def fetch_webpages(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch multiple webpages and append their content to the last message.
    """
    urls: List[str] = context.get("pageFetchURLs", [])
    if urls and context.get("last_message"):
        fetched_pages = await asyncio.gather(*[perform_fetch(url) for url in urls])
        print(f"{fetched_pages=}")
        for page_content in fetched_pages:
            context["last_message"]["content"] += PAGE_CONTENT_TEMPLATE.format(
                page_content=page_content, urls=urls
            )

    return context


async def store_note(query_text: str, user_id: str) -> None:
    """
    Store a note if the query meets memory creation criteria.
    """
    is_memory, plaintext, content = await should_create_memory(query_text)
    if is_memory and content and plaintext:
        await insert_note(
            note=NoteModel(plaintext=plaintext, content=content),
            user_id=user_id,
            auto_created=True,
        )


async def fetch_notes(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch similar notes and append their content to the last message.
    """
    last_message = context["last_message"]
    query_text = context["query_text"]
    user = context["user"]
    notes = await search_notes_by_similarity(
        input_text=query_text, user_id=user.get("user_id")
    )
    if notes:
        last_message["content"] = NOTES_CONTEXT_TEMPLATE.format(
            message=last_message["content"], notes="- ".join(notes)
        )
        context["notes_added"] = True
    else:
        context["notes_added"] = False
    return context


async def fetch_documents(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch documents related to the query and append their content to the last message.
    """
    last_message = context["last_message"]
    query_text = context["query_text"]
    conversation_id = context["conversation_id"]
    user_id = context["user_id"]

    documents = await query_documents(query_text, conversation_id, user_id)

    if documents and len(documents) > 0:
        content = [doc["content"] for doc in documents]
        titles = [doc["title"] for doc in documents]
        prompt = DOCUMENTS_CONTEXT_TEMPLATE.format(
            message=last_message["content"], titles=titles, content=content
        )
        last_message["content"] = prompt
        context["docs_added"] = True
    else:
        context["docs_added"] = False
    return context


async def classify_intent(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Classify the intent of the user's message and set the intent in the context.
    This determines how the message will be processed in the pipeline.

    Supported intents:
    - "calendar": Add events to calendar
    - "generate_image": Create an image from a text description
    - None: Regular chat message (default)

    Args:
        context (Dict[str, Any]): The pipeline context

    Returns:
        Dict[str, Any]: Updated context with intent classification
    """
    result = await classify_event_type(context["query_text"])

    if result.get("highest_label") and result.get("highest_score", 0) >= 0.5:
        if result["highest_label"] in ["add to calendar"]:
            context["intent"] = "calendar"
        elif result["highest_label"] in ["generate image"]:
            context["intent"] = "generate_image"

    return context


async def choose_llm_model(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Choose an LLM model based on whether notes or documents were added.
    """
    if context.get("notes_added") or context.get("docs_added"):
        context["llm_model"] = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    return context


async def process_message_content(context: Dict[str, Any]) -> Dict[str, Any]:
    """Process message content for URLs and other enrichments.

    Args:
        content (str): The message content to process

    Returns:
        Dict[str, Any]: Dictionary containing processed content and metadata
    """
    urls = extract_urls_from_text(context["query_text"])

    context["pageFetchURLs"] = urls

    return context


async def chat_stream(
    body: MessageRequestWithHistory,
    background_tasks: BackgroundTasks,
    user: dict,
    llm_model: str,
) -> StreamingResponse:
    """
    Stream chat messages in real-time using the plug-and-play pipeline.

    This function coordinates the processing of chat messages through a pipeline,
    including optional web search, deep internet search, document fetching,
    and other enhancements before sending to the language model.

    Args:
        body (MessageRequestWithHistory): Contains the message, conversation ID, message history,
                                         and optional flags for search features
        background_tasks (BackgroundTasks): FastAPI background tasks object for async operations
        user (dict): User information from authentication
        llm_model (str): Default LLM model identifier to use for generation

    Returns:
        StreamingResponse: A streaming response containing the LLM's generated content
    """
    last_message = body.messages[-1] if body.messages else None

    context = {
        "user_id": user.get("user_id"),
        "conversation_id": body.conversation_id,
        "query_text": last_message["content"],
        "last_message": last_message,
        "body": body,
        "llm_model": llm_model,
        "user": user,
        "intent": None,
        "messages": jsonable_encoder(body.messages),
        "search_web": body.search_web,
        "deep_search": body.deep_search,
        "pageFetchURLs": body.pageFetchURLs,
    }

    context = await classify_intent(context)

    if context["intent"] == "generate_image":
        return StreamingResponse(
            generate_image_stream(context["query_text"]),
            media_type="text/event-stream",
        )

    pipeline_steps = [
        fetch_webpages,
        # choose_llm_model,
        do_deep_search,
        do_search,
        fetch_notes,
        fetch_documents,
    ]

    pipeline = Pipeline(pipeline_steps)
    context = await pipeline.run(context)

    background_tasks.add_task(store_note, context["query_text"], context["user_id"])

    context["messages"][-1] = context["last_message"]

    return StreamingResponse(
        do_prompt_with_stream(
            messages=context["messages"],
            max_tokens=4096,
            intent=context["intent"],
            model=context["llm_model"],
            context=context,
        ),
        media_type="text/event-stream",
    )


async def chat(request: MessageRequest) -> dict:
    """
    Get a chat response without streaming.
    """
    response = await do_prompt_no_stream(request.message)
    return response


async def create_conversation(conversation: ConversationModel, user: dict) -> dict:
    """
    Create a new conversation.
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

    return {
        "conversation_id": conversation.conversation_id,
        "user_id": user_id,
        "createdAt": created_at,
        "detail": "Conversation created successfully",
    }


async def get_conversations(user: dict, page: int = 1, limit: int = 10) -> dict:
    """
    Fetch paginated conversations for the authenticated user, including starred conversations.
    """
    user_id = user["user_id"]

    projection = {
        "_id": 1,
        "user_id": 1,
        "conversation_id": 1,
        "description": 1,
        "starred": 1,
        "createdAt": 1,
    }

    starred_filter = {"user_id": user_id, "starred": True}
    non_starred_filter = {
        "user_id": user_id,
        "$or": [{"starred": {"$exists": False}}, {"starred": False}],
    }
    skip = (page - 1) * limit

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

    def convert_ids(conversations):
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
        return conversations

    starred_conversations = convert_ids(starred_conversations)
    non_starred_conversations = convert_ids(non_starred_conversations)

    combined_conversations = starred_conversations + non_starred_conversations
    total = len(starred_conversations) + non_starred_count
    total_pages = (
        ((non_starred_count + limit - 1) // limit) if non_starred_count > 0 else 1
    )

    result = {
        "conversations": combined_conversations,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }

    return result


async def get_conversation(conversation_id: str, user: dict) -> dict:
    """
    Fetch a specific conversation by ID.
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


async def update_messages(request: UpdateMessagesRequest, user: dict) -> dict:
    """
    Add messages to an existing conversation.
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
    conversation_id: str, data: DescriptionUpdateRequestLLM, user: dict, model: str
) -> dict:
    """
    Update the conversation description using an LLM-generated summary.
    """
    user_id = user.get("user_id")
    description = "New Chat"

    try:
        response = await do_prompt_no_stream(
            prompt=CONVERSATION_DESCRIPTION_GENERATOR.format(
                user_message=data.userFirstMessage
            ),
            max_tokens=5,
            model=model,
        )
        description = (response.get("response", "New Chat")).replace('"', "")
    except Exception as e:
        logger.error(f"LLM call failed: {e}")

    try:
        update_result = await conversations_collection.update_one(
            {"user_id": user_id, "conversation_id": conversation_id},
            {"$set": {"description": description}},
        )

        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=404, detail="Conversation not found or update failed"
            )
    except Exception as e:
        logger.error(f"Update conversation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Update failed {e}")

    return {
        "message": "Conversation updated successfully",
        "description": description,
    }


async def update_conversation_description(
    conversation_id: str, data: DescriptionUpdateRequest, user: dict
) -> dict:
    """
    Update the conversation description.
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

    return {
        "message": "Conversation updated successfully",
        "description": data.description,
    }


async def star_conversation(conversation_id: str, starred: bool, user: dict) -> dict:
    """
    Star or unstar a conversation.
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

    return {"message": "Conversation updated successfully", "starred": starred}


async def delete_all_conversations(user: dict) -> dict:
    """
    Delete all conversations for the authenticated user.
    """
    user_id = user.get("user_id")
    delete_result = await conversations_collection.delete_many({"user_id": user_id})

    if delete_result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="No conversations found for the user",
        )

    return {"message": "All conversations deleted successfully"}


async def delete_conversation(conversation_id: str, user: dict) -> dict:
    """
    Delete a specific conversation by ID.
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

    return {
        "message": "Conversation deleted successfully",
        "conversation_id": conversation_id,
    }


async def pin_message(
    conversation_id: str, message_id: str, pinned: bool, user: dict
) -> dict:
    """
    Pin or unpin a message within a conversation.
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
        raise HTTPException(status_code=404, detail="Message not found in conversation")

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


async def generate_image_stream(query_text: str) -> AsyncGenerator[str, None]:
    """
    Create a streaming generator for image generation responses.
    This generator yields data in the format expected by the frontend
    for image generation results.

    Args:
        query_text (str): The user's text prompt for image generation

    Yields:
        str: Formatted response lines for streaming
    """
    try:
        yield f"data: {json.dumps({'status': 'generating_image'})}\n\n"

        image_result = await image_service.api_generate_image(query_text)

        yield f"data: {json.dumps({'intent': 'generate_image', 'image_data': image_result})}\n\n"

        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        yield f"data: {json.dumps({'error': f'Failed to generate image: {str(e)}'})}\n\n"
        yield "data: [DONE]\n\n"
