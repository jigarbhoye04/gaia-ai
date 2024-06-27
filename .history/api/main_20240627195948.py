from fastapi import FastAPI
from dotenv import load_dotenv

app = FastAPI()
load_dotenv()


@app.get("/")
def read_root():
    return os.env


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
