import requests
import os

# Note for future:
# Train a model with all these classification so that it's easier to classify the users intents to do a task and have the llm respond accordingly


def classify_event_type(input):
    return send_request(
        input,
        [
            "add event to calendar",
            "send an email",
            "generate image",
            "search something",
        ],
    )


def classify_output(input):
    return send_request(input, ["i dont know this", "i know this"])


async def send_request(input, candidate_labels):
    response = requests.post(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        headers={"Authorization": f"Bearer {os.getenv('HUGGING_FACE')}"},
        json={"inputs": input, "parameters": {"candidate_labels": candidate_labels}},
    )
    data = response.json()
    return {label: score for label, score in zip(data["labels"], data["scores"])}
