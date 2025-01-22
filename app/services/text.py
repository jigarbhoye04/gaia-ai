import asyncio
from transformers import pipeline


def split_text_into_chunks(text, chunk_size=300, overlap=30):
    """
    Splits text into chunks of `chunk_size` with an `overlap` between chunks.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
    return chunks


# Load the zero-shot classification pipeline
zero_shot_classifier = pipeline(
    "zero-shot-classification", model="MoritzLaurer/bge-m3-zeroshot-v2.0"
)

candidate_labels = [
    "add calendar event",
    "send email",
    "generate image",
    "search internet",
    "flowchart",
    "weather",
    "other",
]

candidate_labels_output = ["i don't know this", "i know this"]


def classify_event_type(input):
    return classify_text(input, candidate_labels)


def classify_output(input):
    return classify_text(input, candidate_labels_output)


# Async wrapper for the blocking Hugging Face pipeline call
async def classify_text(input, candidate_labels):
    if not input or not candidate_labels:
        return {"error": "Invalid input or candidate labels."}

    try:
        # Use asyncio.to_thread to run the blocking pipeline function in a separate thread
        result = await asyncio.to_thread(zero_shot_classifier, input, candidate_labels)

        label_scores = dict(zip(result["labels"], result["scores"]))
        highest_label = max(label_scores, key=label_scores.get)

        return {
            "label_scores": label_scores,
            "highest_label": highest_label,
            "highest_score": label_scores[highest_label],
        }
    except Exception as e:
        return {"error": str(e)}


# Example to run the function asynchronously
async def main():
    result = await classify_event_type(
        "Can you find a time for my meeting and send me a reminder?"
    )
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
