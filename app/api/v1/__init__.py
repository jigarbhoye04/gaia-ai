from fastapi import APIRouter
import nltk
from nltk.data import find
from app.api.v1.routes import (
    chat,
    auth,
    search,
    feedback,
    waitlist,
    calendar,
    image,
    document,
    notes,
    goals,
    oauth,
    # gmail,
)

api_router = APIRouter()

api_router.include_router(waitlist.router, tags=["Waitlist"])
api_router.include_router(feedback.router, tags=["Feedback"])
api_router.include_router(chat.router, tags=["Chat"])
api_router.include_router(image.router, tags=["Image"])
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(document.router, tags=["Document"])
api_router.include_router(search.router, tags=["Document"])
api_router.include_router(calendar.router, tags=["Calendar"])
api_router.include_router(notes.router, tags=["Notes/Memories"])
api_router.include_router(goals.router, tags=["Goals"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["OAuth"])
# api_router.include_router(audio.router, tags=["Audio"])
# api_router.include_router(gmail.router, tags=["GMail"])


def download_nltk_resources():
    try:
        # Check if 'punkt' tokenizer is already available
        find("tokenizers/punkt")
        print("Punkt tokenizer already downloaded.")
    except LookupError:
        print("Punkt tokenizer not found. Downloading...")
        nltk.download("punkt")

    try:
        # Check if 'stopwords' is already available
        find("corpora/stopwords")
        print("Stopwords corpus already downloaded.")
    except LookupError:
        print("Stopwords corpus not found. Downloading...")
        nltk.download("stopwords")

    try:
        # Check if 'punkt_tab' is already available
        find("tokenizers/punkt_tab")
        print("Punkt_tab tokenizer already downloaded.")
    except LookupError:
        print("Punkt_tab tokenizer not found. Downloading...")
        nltk.download("punkt_tab")
