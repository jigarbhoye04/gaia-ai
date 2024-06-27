from openai import OpenAI
from fastapi import FastAPI
from dotenv import load_dotenv
import os

app = FastAPI()
load_dotenv()

LLAMA_API_TOKEN: str = os.getenv('LLAMA_API_TOKEN')


client = OpenAI(
    api_key="<your_llamaapi_token>",
    base_url="https://api.llama-api.com"
)

response = client.chat.completions.create(
    model="llama-13b-chat",
    messages=[
        {"role": "system", "content": "Assistant is a large language model trained by OpenAI."},
        {"role": "user", "content": "Who were the founders of Microsoft?"}
    ]

)

# print(response)
print(response.model_dump_json(indent=2))
print(response.choices[0].message.content)


@app.get("/")
def read_root():
    return "hello world"


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
