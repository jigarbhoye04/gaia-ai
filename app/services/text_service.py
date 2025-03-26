import asyncio
from typing import Any, Dict, List, Union

import httpx
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from sumy.nlp.tokenizers import Tokenizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.summarizers.lsa import LsaSummarizer
from app.config.loggers import general_logger as logger
from app.config.settings import settings

# Initialize httpx client for API requests
http_async_client = httpx.AsyncClient()

# Global variable to store the classifier
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

    if settings.USE_HUGGINGFACE_API:
        logger.info("Using Hugging Face API for zero-shot classification")
        return None

    if _zero_shot_classifier is None:
        try:
            from transformers import pipeline

            logger.info(
                f"Loading zero-shot classification model: {settings.HUGGINGFACE_ZSC_MODEL}"
            )
            _zero_shot_classifier = pipeline(
                "zero-shot-classification",
                model=settings.HUGGINGFACE_ZSC_MODEL,
                device=-1,  # CPU
            )
            logger.info("Zero-shot classification model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading zero-shot classification model: {str(e)}")
            raise RuntimeError(f"Failed to load model: {str(e)}")

    return _zero_shot_classifier


def split_text_into_chunks(
    text: str, chunk_size: int = 250, overlap: int = 30
) -> List[str]:
    """
    Split text into chunks of specified size with overlap between chunks.

    Args:
        text: The text to split.
        chunk_size: Maximum number of words per chunk.
        overlap: Number of words to overlap between consecutive chunks.

    Returns:
        List of text chunks.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
    return chunks


async def _classify_text_core(
    user_input: str, candidate_labels: List[str]
) -> Dict[str, Any]:
    """
    Core logic for classifying text asynchronously.
    Uses either Hugging Face API or local model based on settings.
    """
    if not user_input or not candidate_labels:
        return {"error": "Invalid input or candidate labels."}

    try:
        # Check if we should use the Hugging Face API
        if settings.USE_HUGGINGFACE_API:
            # Use the Hugging Face Router API URL as specified
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
        else:
            # Use the local model
            classifier = get_zero_shot_classifier()
            if classifier is None:
                raise RuntimeError("Failed to get zero-shot classifier")

            # Run classification
            result = classifier(user_input, candidate_labels, multi_label=False)
            label_scores = dict(zip(result["labels"], result["scores"]))

        # Process results (same for both methods)
        highest_label = max(label_scores, key=label_scores.get)
        return {
            "label_scores": label_scores,
            "highest_label": highest_label,
            "highest_score": label_scores[highest_label],
        }
    except Exception as e:
        logger.error(f"Error during text classification: {str(e)}")
        return {"error": str(e)}


def classify_text(
    user_input: str, candidate_labels: List[str], *, async_mode: bool = True
) -> Union[Dict[str, Any], asyncio.Future]:
    """
    Classify text into one of the provided candidate labels.

    Args:
        user_input: The text to classify.
        candidate_labels: List of possible classification labels.
        async_mode: If True (default), runs classification asynchronously.

    Returns:
        If async_mode is True, returns a coroutine; otherwise, returns the classification dictionary.
    """
    if async_mode:
        return asyncio.ensure_future(_classify_text_core(user_input, candidate_labels))
    else:
        return asyncio.run(_classify_text_core(user_input, candidate_labels))


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
) -> Union[Dict[str, Any], asyncio.Future]:
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


def classify_event_type(
    user_input: str, *, async_mode: bool = True
) -> Union[Dict[str, Any], asyncio.Future]:
    """
    Classify user input into event types for task routing.

    Args:
        user_input: The text to classify.
        async_mode: If True (default), runs classification asynchronously.

    Returns:
        Classification results.
    """
    labels = [
        "add to calendar",
        "send email",
        "generate image",
        "search internet",
        "flowchart",
        "weather",
        "other",
    ]
    return classify_text(user_input, labels, async_mode=async_mode)


def classify_output(
    user_input: str, *, async_mode: bool = True
) -> Union[Dict[str, Any], asyncio.Future]:
    """
    Classify whether the system has knowledge about the user input.

    Args:
        user_input: The text to classify.
        async_mode: If True (default), runs classification asynchronously.

    Returns:
        Classification results.
    """
    labels = ["i don't know this", "i know this"]
    return classify_text(user_input, labels, async_mode=async_mode)


def summarise_text(long_text: str, sentences: int = 4) -> str:
    """
    Summarize long text into a shorter version using LSA summarization.

    Args:
        long_text: The text to summarize.
        sentences: Number of sentences to include in the summary.

    Returns:
        Summarized text.
    """
    nltk.download("punkt", quiet=True)
    parser = PlaintextParser.from_string(long_text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, sentences)
    short_text = "".join(str(sentence) for sentence in summary)
    return short_text


def remove_stopwords(text):
    """Remove stopwords from text."""
    try:
        stop_words = set(stopwords.words("english"))
        word_tokens = word_tokenize(text)

        filtered_text = [word for word in word_tokens if word.lower() not in stop_words]
        return " ".join(filtered_text)
    except Exception as e:
        logger.warning(f"Error removing stopwords: {e}")
        return text
