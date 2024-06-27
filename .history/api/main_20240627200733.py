from pydantic import BaseModel
from openai import OpenAI
from fastapi import FastAPI
from dotenv import load_dotenv
import os

app = FastAPI()
load_dotenv()

LLAMA_API_TOKEN = os.getenv('LLAMA_API_TOKEN')


class MessageRequest(BaseModel):
    # user_id: str
    message: str


class MessageResponse(BaseModel):
    response: str


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


@app.get("/prompt")
def doPrompt(request: MessageRequest):
    ...
