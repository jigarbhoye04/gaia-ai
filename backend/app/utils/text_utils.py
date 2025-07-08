import asyncio
from typing import Any, Dict, List

import httpx
from app.config.loggers import general_logger as logger
from app.config.settings import settings
from transformers import pipeline


http_async_client = httpx.AsyncClient()


_zero_shot_classifier = None


def get_zero_shot_classifier():
    """
    Get or initialize the zero-shot classifier.
    If USE_HUGGINGFACE_API is True, this will return None as the API is used instead.
    Otherwise, it loads the model locally.

    Returns:
        The classifier object if using local model, None if using API.
    """
    global _zero_shot_classifier
    logger.info("ZSC: Initializing zero-shot classification model...")

    if settings.USE_HUGGINGFACE_API:
        logger.info("ZSC: Using Hugging Face API for zero-shot classification")
        return None

    if _zero_shot_classifier is None:
        try:
            logger.info(
                f"ZSC: Loading zero-shot classification model: {settings.HUGGINGFACE_ZSC_MODEL}"
            )
            _zero_shot_classifier = pipeline(
                "zero-shot-classification",
                model=settings.HUGGINGFACE_ZSC_MODEL,
                device=-1,
            )
            logger.info("ZSC: Zero-shot classification model loaded successfully")
        except Exception as e:
            logger.error(f"ZSC: Error loading zero-shot classification model: {str(e)}")
            raise RuntimeError(f"ZSC: Failed to load model: {str(e)}")

    logger.info("ZSC: Model initialization completed.")

    return _zero_shot_classifier


async def _classify_text_core(
    user_input: str, candidate_labels: List[str]
) -> Dict[str, Any]:
    """
    Core logic for classifying text asynchronously.
    Uses either Hugging Face API or local model based on settings.
    Falls back to local model if the API returns a server error.
    """
    if not user_input or not candidate_labels:
        return {"error": "Invalid input or candidate labels."}

    try:
        if settings.USE_HUGGINGFACE_API:
            try:
                api_url = (
                    f"{settings.HUGGINGFACE_ROUTER_URL}{settings.HUGGINGFACE_ZSC_MODEL}"
                )

                response = await http_async_client.post(
                    api_url,
                    headers={"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"},
                    json={
                        "inputs": user_input,
                        "parameters": {"candidate_labels": candidate_labels},
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()
                label_scores = dict(zip(result["labels"], result["scores"]))
            except httpx.HTTPStatusError as e:
                # Check for server errors (5xx)
                if e.response.status_code >= 500:
                    logger.warning(
                        f"Hugging Face API server error: {str(e)}. Falling back to local model."
                    )
                    classifier = get_zero_shot_classifier()

                    # classifier = pipeline(
                    #     "zero-shot-classification",
                    #     model=settings.HUGGINGFACE_ZSC_MODEL,
                    #     device=-1,
                    # )
                    result = classifier(user_input, candidate_labels, multi_label=False)
                    label_scores = dict(zip(result["labels"], result["scores"]))
                else:
                    # Re-raise if it's not a server error
                    raise
        else:
            classifier = get_zero_shot_classifier()
            if classifier is None:
                raise RuntimeError("Failed to get zero-shot classifier")

            result = classifier(user_input, candidate_labels, multi_label=False)
            label_scores = dict(zip(result["labels"], result["scores"]))

        highest_label = max(label_scores, key=lambda k: label_scores[k])
        return {
            "label_scores": label_scores,
            "highest_label": highest_label,
            "highest_score": label_scores[highest_label],
        }
    except Exception as e:
        logger.error(f"Error during text classification: {str(e)}")
        return {"error": str(e)}


async def _classify_email_core(email_text: str) -> Dict[str, Any]:
    """
    Core logic for classifying email asynchronously using Hugging Face API.

    Returns a dictionary containing classification results and importance flag.
    Email is considered important if it matches a notify label AND has a score > 0.6.
    """
    notify_labels = [
        "urgent",
        "action_required",
        "priority",
        "personal",
        "professional",
        "important",
        "time_sensitive",
    ]

    email_labels = notify_labels + [
        "updates",
        "promotional",
        "social",
        "automated",
        "feedback",
        "subscription",
        "spam",
        "transactional",
        "not important",
    ]

    results = await _classify_text_core(email_text, email_labels)
    if "error" in results:
        return {"error": results["error"], "is_important": False}

    results["is_important"] = (
        results["highest_label"] in notify_labels and results["highest_score"] > 0.6
    )
    return results


def classify_email(
    email_text: str, *, async_mode: bool = True
) -> Dict[str, Any] | asyncio.Future:
    """
    Classify an email and determine if it requires notification.

    Args:
        email_text: The content of the email to classify.
        async_mode: If True (default), runs classification asynchronously.

    Returns:
        If async_mode is True, returns a coroutine; otherwise, returns the classification dictionary.
    """
    if async_mode:
        return asyncio.ensure_future(_classify_email_core(email_text))
    else:
        return asyncio.run(_classify_email_core(email_text))
