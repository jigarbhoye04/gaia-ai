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
    return "Hello World"


@app.get("/prompt")
def doPrompt(request: MessageRequest):
    user_message: str = request.message

        
    chatbot_response: str = f"Received your message: {user_message}"

    return MessageResponse(response=chatbot_response)
