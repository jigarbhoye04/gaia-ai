import asyncio
from typing import Any, Dict, List, Union

import nltk
from sumy.nlp.tokenizers import Tokenizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.summarizers.lsa import LsaSummarizer
from transformers import pipeline
from functools import lru_cache


@lru_cache(maxsize=1)
def get_zero_shot_classifier():
    """Lazy-load the zero-shot classification pipeline and cache it."""
    return pipeline(
        "zero-shot-classification", model="MoritzLaurer/bge-m3-zeroshot-v2.0"
    )


# zero_shot_classifier_larger = pipeline(
#     "zero-shot-classification",
#     model="MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli",
# )


def split_text_into_chunks(
    text: str, chunk_size: int = 250, overlap: int = 30
) -> List[str]:
    """
    Split text into chunks of specified size with overlap between chunks.

    Args:
        text: The text to split into chunks
        chunk_size: Maximum number of words per chunk
        overlap: Number of words to overlap between consecutive chunks

    Returns:
        List of text chunks
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
    return chunks


async def classify_text(
    user_input: str,
    candidate_labels: List[str],
) -> Dict[str, Any]:
    """
    Classify text into one of the provided candidate labels using zero-shot classification.

    Args:
        user_input: The text to classify
        candidate_labels: List of possible classification labels
        classifier: The classification pipeline to use

    Returns:
        Dictionary containing classification results:
        - label_scores: Dictionary mapping labels to confidence scores
        - highest_label: The label with the highest confidence score
        - highest_score: The confidence score of the highest label
        - error: Error message if classification fails
    """
    classifier = get_zero_shot_classifier()

    if not user_input or not candidate_labels or not classifier:
        return {"error": "Invalid input or candidate labels."}

    try:
        # Use asyncio.to_thread to run the blocking pipeline function in a separate thread
        result = await asyncio.to_thread(classifier, user_input, candidate_labels)

        label_scores = dict(zip(result["labels"], result["scores"]))
        highest_label = max(label_scores, key=label_scores.get)

        return {
            "label_scores": label_scores,
            "highest_label": highest_label,
            "highest_score": label_scores[highest_label],
        }
    except Exception as e:
        return {"error": str(e)}


def classify_event_type(user_input: str) -> Dict[str, Any]:
    """
    Classify user input into event types for task routing.

    Args:
        user_input: The text to classify

    Returns:
        Dictionary containing classification results
    """
    labels = [
        "add to calendar",
        # "set a reminder",
        "send email",
        "generate image",
        "search internet",
        "flowchart",
        "weather",
        "other",
    ]
    return classify_text(user_input, labels)


def classify_output(user_input: str) -> Dict[str, Any]:
    """
    Classify whether the system has knowledge about the user input.

    Args:
        user_input: The text to classify

    Returns:
        Dictionary containing classification results
    """
    labels = ["i don't know this", "i know this"]
    return classify_text(user_input, labels)


def summarise_text(long_text: str, sentences: int = 4) -> str:
    """
    Summarize long text into a shorter version using LSA summarization.

    Args:
        long_text: The text to summarize
        sentences: Number of sentences to include in the summary

    Returns:
        Summarized text
    """
    nltk.download("punkt", quiet=True)
    parser = PlaintextParser.from_string(long_text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, sentences)
    short_text = "".join(str(sentence) for sentence in summary)
    return short_text


async def classify_email(email_text: str) -> Union[Dict[str, Any], bool]:
    """
    Classify an email and determine if it requires notification.

    Args:
        email_text: The content of the email to classify

    Returns:
        Dictionary with classification results including should_notify flag,
        or False if there was an error
    """
    email_labels = [
        "reminder",
        "important",
        "personal",
        "updates",
        "promotional",
        "social",
    ]
    notify_labels = ["reminder", "important", "personal"]

    results = await classify_text(email_text, email_labels)

    if "error" in results:
        return {"error": results["error"], "is_important": False}

    results["is_important"] = results["highest_label"] in notify_labels

    return results


# Named Entity Recognition functionality (currently commented out)
# To enable:
# 1. Uncomment the code
# 2. Install spaCy and download the model with: python -m spacy download en_core_web_sm

# import spacy
# nlp = spacy.load("en_core_web_sm")

# def parse_calendar_info(input_text: str) -> Dict[str, str]:
#     """
#     Extract date and time information from text using spaCy NER.
#
#     Args:
#         input_text: The text to extract information from
#
#     Returns:
#         Dictionary containing extracted time and date information
#     """
#     doc = nlp(input_text)
#
#     time = "all day"
#     date = "today"
#
#     for ent in doc.ents:
#         if ent.label_ == "TIME":
#             time = ent.text
#         elif ent.label_ == "DATE":
#             date = ent.text
#
#     return {"time": time, "date": date}
