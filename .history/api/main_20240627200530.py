from openai import OpenAI
from fastapi import FastAPI
from dotenv import load_dotenv
import os

app = FastAPI()
load_dotenv()

LLAMA_API_TOKEN: str = os.getenv('LLAMA_API_TOKEN')


client = OpenAI(
    api_key=LLAMA_API_TOKEN,
    base_url="https://api.llama-api.com"
)


@app.get("/")
def read_root():

    response = client.chat.completions.create(
        model="llama-13b-chat",
        messages=[
            {"role": "system",
                "content": "Assistant's name is GAIA - a general purpose artifificial intelligence assistant. The assistants personality is chill, fun and kind but uses proper grammar and language."},
            {"role": "user", "content": "Hey how are you doing?"}
        ]

    )

    # print(response)
    print(response.model_dump_json(indent=2))

    return response.choices[0].message.content


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}


@app.get("/promptM")
