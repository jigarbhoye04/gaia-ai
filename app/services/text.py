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


def classify_event_type(input):
    candidate_labels = [
        "add calendar event",
        "send email",
        "generate image",
        "search internet",
        "other",
    ]
    return classify_text(input, candidate_labels)


def classify_output(input):
    candidate_labels = ["i don't know this", "i know this"]
    return classify_text(input, candidate_labels)


def classify_text(input, candidate_labels):
    result = zero_shot_classifier(input, candidate_labels)
    label_scores = dict(zip(result["labels"], result["scores"]))
    highest_label = max(label_scores, key=label_scores.get)

    return {
        "label_scores": label_scores,
        "highest_label": highest_label,
        "highest_score": label_scores[highest_label],
    }


print(classify_event_type("Can you find a time for my meeting and send me a reminder?"))
