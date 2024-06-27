from fastapi import FastAPI
from dotenv import load_dotenv
import os

app = FastAPI()
load_dotenv()
llama_token = os.getenv('LLAMA_API_TOKEN')

@app.get("/")
def read_root():
    return 


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
