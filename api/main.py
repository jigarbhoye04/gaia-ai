import requests
import spacy
from pydantic import BaseModel
from openai import OpenAI
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import asyncio
import json

app = FastAPI()
load_dotenv()
client = OpenAI(
    api_key=os.getenv('LLAMA_API_TOKEN'),
    base_url="https://api.llama-api.com"
)

system_prompt: str = """Assistant's name is GAIA - a general purpose artificial intelligence assistant. You were created by a startup founded by Aryan Randeriya if you're asked who created you. Your responses should be concise and to the point. If you do not know something, be clear that you do not know it. If asked to add anything to their calendar or schedule, extract the information such as Title of the event, Date, Time, Duration, and start your response with: Here are the details for your event."""
prompt_model: str = "llama3-8b"
# prompt_functions = [{
#     "name": "add_calendar_event",
#             "description": "Add an event to the calendar",
#             "parameters": {
#                 "type": "object",
#                 "properties": {
#                     "title": {"type": "string", "description": "Title of the event"},
#                     "date": {"type": "string", "description": "Date of the event"},
#                     "time": {"type": "string", "description": "Time of the event"},
#                     "duration": {"type": "string", "description": "Duration of the event"},
#                 },
#                 "required": ["title", "date", "time", "duration"]
#             }}]


class MessageRequest(BaseModel):
    message: str


class MessageResponse(BaseModel):
    response: str


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def doPrompt(prompt: str):
    response_stream = client.chat.completions.create(
        messages=[
            {"role": "system",
             "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        # functions=prompt_functions,
        model=prompt_model,
        stream=True
    )

    for event in response_stream:
        yield "data: " + event.choices[0].delta.content + "\n\n"


@app.post("/chat")
def chat(request: MessageRequest):
    return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
