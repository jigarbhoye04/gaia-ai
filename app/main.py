import uvicorn
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api.v1 import auth, chat, document, feedback, image, oauth, waitlist
from db.connect import connect

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="GAIA API", version="1.0.0", description="The AI assistant backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins= [
    "http://localhost:5173",
    "https://localhost:5173",
    "http://192.168.138.215:5173",
    "https://192.168.13.215:5173",
    "https://gaia.aryanranderiya.com",
],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

load_dotenv()
connect()

app.include_router(waitlist.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(image.router, prefix="/api/v1")
app.include_router(document.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(oauth.router, prefix="/api/v1/oauth")


@app.get("/")
async def read_root():
    return {"message": "Welcome to the GAIA API!"}


@app.get("/ping")
def main():
    logger.info("Pinged server successfully!")
    return {"status": "GAIA API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
