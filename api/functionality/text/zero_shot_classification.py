import requests
import os


def classify_event_type(input):
    return send_request(input, ["add event to calendar", "send an email"])


def classify_output(input):
    return send_request(input, ["i dont know this", "i know this"])


def send_request(input, candidate_labels):
    response = requests.post(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        headers={"Authorization": f"Bearer {os.getenv('HUGGING_FACE')}"},
        json={
            "inputs": input,
            "parameters": {
                "candidate_labels": candidate_labels
            }
        }

    )
    print(response.json())
    return response.json()
