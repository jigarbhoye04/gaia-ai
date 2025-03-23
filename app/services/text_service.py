import asyncio
from functools import lru_cache
from typing import Any, Dict, List, Union

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from sumy.nlp.tokenizers import Tokenizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.summarizers.lsa import LsaSummarizer
from transformers import pipeline
from app.config.loggers import general_logger as logger


@lru_cache(maxsize=1)
def get_zero_shot_classifier():
    """Lazy-load the zero-shot classification pipeline and cache it."""
    return pipeline(
        "zero-shot-classification", model="MoritzLaurer/bge-m3-zeroshot-v2.0"
    )


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


def _classify_text_core(user_input: str, candidate_labels: List[str]) -> Dict[str, Any]:
    """
    Core logic for classifying text synchronously.
    """
    classifier = get_zero_shot_classifier()

    if not user_input or not candidate_labels or not classifier:
        return {"error": "Invalid input or candidate labels."}

    try:
        result = classifier(user_input, candidate_labels)
        label_scores = dict(zip(result["labels"], result["scores"]))
        highest_label = max(label_scores, key=label_scores.get)
        return {
            "label_scores": label_scores,
            "highest_label": highest_label,
            "highest_score": label_scores[highest_label],
        }
    except Exception as e:
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
        return asyncio.to_thread(_classify_text_core, user_input, candidate_labels)
    else:
        return _classify_text_core(user_input, candidate_labels)


def _classify_email_core(email_text: str) -> Dict[str, Any]:
    """
    Core logic for classifying email synchronously.

    Returns a dictionary containing classification results and importance flag.
    Email is considered important if it matches a notify label AND has a score > 0.6.
    """
    notify_labels = [
        "urgent",
        "action_required",
        "priority",
        "personal",
        "professional",
        "financial",
        "official",
        "time_sensitive",
        "health",
        "confirmation",
        "security",
    ]

    email_labels = notify_labels + [
        "updates",
        "promotional",
        "social",
        "spam",
        "newsletter",
        "notification",
        "automated",
        "feedback",
        "subscription",
        "spam",
        "advertisement",
        "marketing",
        "transactional",
    ]

    results = _classify_text_core(email_text, email_labels)
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
        return asyncio.to_thread(_classify_email_core, email_text)
    else:
        return _classify_email_core(email_text)


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
