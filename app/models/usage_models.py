from datetime import datetime
from typing import List
from pydantic import BaseModel, Field
from enum import Enum
from typing import Dict

class UsagePeriod(str, Enum):
    HOUR = "hour"
    DAY = "day"
    MONTH = "month"


class FeatureUsage(BaseModel):
    feature_key: str
    feature_title: str
    period: UsagePeriod
    used: int = 0
    limit: int = 0
    reset_time: datetime
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserUsageSnapshot(BaseModel):
    user_id: str
    plan_type: str
    features: List[FeatureUsage] = []
    snapshot_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)


FEATURE_REGISTRY = {
    "image_generation": {
        "title": "AI Image Generation",
        "description": "Generate images using AI models",
    },
    "chat_messages": {
        "title": "Chat Messages",
        "description": "Send messages to AI assistants",
    },
    "file_analysis": {
        "title": "File Analysis",
        "description": "Analyze and process uploaded files",
    },
    "api_calls": {
        "title": "API Calls",
        "description": "Make API calls to external services",
    },
    "document_search": {
        "title": "Document Search",
        "description": "Search through documents and knowledge base",
    },
    "web_search": {
        "title": "Web Search", 
        "description": "Search the web for information",
    },
    "calendar": {
        "title": "Calendar Operations",
        "description": "Manage calendar events and schedules",
    },
    "email": {
        "title": "Email Operations",
        "description": "Send and manage emails",
    },
    "notes": {
        "title": "Notes & Memories",
        "description": "Create and manage notes",
    },
    "goals": {
        "title": "Goal Management",
        "description": "Track and manage goals",
    },
    "todos": {
        "title": "Todo Management",
        "description": "Manage tasks and todos",
    },
    "memory": {
        "title": "Memory Operations",
        "description": "Store and retrieve memories",
    },
    "browser": {
        "title": "Browser Automation",
        "description": "Automate browser operations",
    },
    "conversations": {
        "title": "Conversations",
        "description": "Create new conversations",
    },
    "webhooks": {
        "title": "Webhook Operations",
        "description": "Handle webhook requests",
    }
}


def get_feature_info(feature_key: str) -> Dict[str, str]:
    """Get user-friendly feature information."""
    return FEATURE_REGISTRY.get(feature_key, {
        "title": feature_key.replace("_", " ").title(),
        "description": f"Usage for {feature_key}",
        "category": "General"
    })
