from fastapi import APIRouter
from app.api.v1.routes import (
    chat,
    auth,
    search,
    feedback,
    waitlist,
    gcalendar,
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
api_router.include_router(gcalendar.router, tags=["Calendar"])
api_router.include_router(notes.router, tags=["Notes/Memories"])
api_router.include_router(goals.router, tags=["Goals"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["OAuth"])
# api_router.include_router(audio.router, tags=["Audio"])
# api_router.include_router(gmail.router, tags=["GMail"])
