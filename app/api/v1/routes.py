"""
GAIA API v1 package.

This package contains the API routes and dependencies for version 1 of the GAIA API.
"""

from fastapi import APIRouter

from app.api.v1.router import (
    blog,
    browser,
    calendar,
    chat,
    conversations,
    feedback,
    file,
    team,
    goals,
    image,
    mail,
    mail_webhook,
    memory,
    notes,
    notification,
    oauth,
    search,
    support,
    todos,
    waitlist,
    websocket,
)

router = APIRouter()

router.include_router(chat.router, tags=["Chat"])
router.include_router(conversations.router, tags=["Conversations"])
router.include_router(waitlist.router, tags=["Waitlist"])
router.include_router(feedback.router, tags=["Feedback"])
router.include_router(image.router, tags=["Image"])
router.include_router(search.router, tags=["Search"])
router.include_router(calendar.router, tags=["Calendar"])
router.include_router(notes.router, tags=["Notes/Memories"])
router.include_router(memory.router, tags=["Memory"], prefix="/memory")
router.include_router(goals.router, tags=["Goals"])
router.include_router(oauth.router, prefix="/oauth", tags=["OAuth"])
router.include_router(mail.router, tags=["Mail"])
router.include_router(blog.router, tags=["Blog"])
router.include_router(team.router, tags=["Team"])
router.include_router(file.router, tags=["File"])
router.include_router(browser.router, tags=["Browser"])
router.include_router(notification.router, tags=["Notification"])
router.include_router(websocket.router, tags=["WebSocket"])
router.include_router(mail_webhook.router, tags=["Mail Webhook"])
router.include_router(todos.router, tags=["Todos"])
router.include_router(support.router, tags=["Support"])
# api_router.include_router(audio.router, tags=["Audio"])
