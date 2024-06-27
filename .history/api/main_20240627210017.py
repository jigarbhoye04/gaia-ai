from pydantic import BaseModel
from openai import OpenAI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return "Hello World"


@app.post("/chat")
def doPrompt(request: MessageRequest):
    user_message: str = request.message

    print(user_message)
    time.sleep(100)
    return user_message

    # response = client.chat.completions.create(
    #     model="llama3-8b",
    #     messages=[
    #         {"role": "system",
    #             "content": "Assistant's name is GAIA - a general purpose artifificial intelligence assistant. The assistants personality is chill, fun and kind but uses proper grammar and language."},
    #         {"role": "user", "content": user_message}
    #     ]

    # )

    # print(response.model_dump_json(indent=2))
    # chatbot_response = response.choices[0].message.content
    # return MessageResponse(response=chatbot_response)
