from typing import Any, Dict
from app.utils.text_utils import classify_event_type
from app.utils.search_utils import extract_urls_from_text


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


async def process_message_urls(context: Dict[str, Any]) -> Dict[str, Any]:
    """Process message content for URLs and other enrichments.

    Args:
        content (str): The message content to process

    Returns:
        Dict[str, Any]: Dictionary containing processed content and metadata
    """
    urls = extract_urls_from_text(context["query_text"])

    context["pageFetchURLs"] = urls

    return context
