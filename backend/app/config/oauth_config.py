"""
OAuth Integration Configuration

This module defines all OAuth integrations dynamically.
Add new integrations by simply adding to the OAUTH_INTEGRATIONS list.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel


class OAuthScope(BaseModel):
    """OAuth scope configuration."""

    scope: str
    description: str


class OAuthIntegration(BaseModel):
    """OAuth integration configuration."""

    id: str
    name: str
    description: str
    icons: List[str]  # List of icon URLs
    category: str
    provider: str  # 'google', 'github', 'figma', 'notion', etc.
    scopes: List[OAuthScope]
    available: bool = True
    oauth_endpoints: Optional[Dict[str, str]] = None
    # Special display properties
    is_special: bool = False  # For unified integrations like Google Workspace
    display_priority: int = 0  # Higher priority shows first
    included_integrations: List[str] = []  # Child integrations for unified ones


class IntegrationConfigResponse(BaseModel):
    """Response model for integration configuration."""

    id: str
    name: str
    description: str
    icons: List[str]
    category: str
    provider: str
    available: bool
    loginEndpoint: Optional[str]
    isSpecial: bool
    displayPriority: int
    includedIntegrations: List[str]


# Define all integrations dynamically
OAUTH_INTEGRATIONS: List[OAuthIntegration] = [
    # Google Workspace - Unified Integration
    OAuthIntegration(
        id="google_workspace",
        name="Google Workspace",
        description="Connect all Google tools at once",
        icons=[
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1920px-Google_%22G%22_logo.svg.png",
            "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/640px-Google_Calendar_icon_%282020%29.svg.png",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Google_Docs_2020_Logo.svg/640px-Google_Docs_2020_Logo.svg.png",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/640px-Google_Drive_icon_%282020%29.svg.png",
        ],
        category="productivity",
        provider="google",
        scopes=[
            # Combined scopes from all Google integrations
            OAuthScope(
                scope="https://www.googleapis.com/auth/gmail.modify",
                description="Read, compose, and send emails",
            ),
            OAuthScope(
                scope="https://www.googleapis.com/auth/calendar.events",
                description="Create and manage calendar events",
            ),
            OAuthScope(
                scope="https://www.googleapis.com/auth/calendar.readonly",
                description="View calendar events",
            ),
            OAuthScope(
                scope="https://www.googleapis.com/auth/documents",
                description="Create and edit documents",
            ),
            OAuthScope(
                scope="https://www.googleapis.com/auth/drive.file",
                description="Create and manage files",
            ),
        ],
        is_special=True,
        display_priority=100,
        included_integrations=[
            "gmail",
            "google_calendar",
            "google_docs",
            "google_drive",
        ],
    ),
    # Individual Google integrations
    OAuthIntegration(
        id="google_calendar",
        name="Google Calendar",
        description="Schedule and manage your calendar events seamlessly",
        icons=[
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/640px-Google_Calendar_icon_%282020%29.svg.png"
        ],
        category="productivity",
        provider="google",
        scopes=[
            OAuthScope(
                scope="https://www.googleapis.com/auth/calendar.events",
                description="Create and manage calendar events",
            ),
            OAuthScope(
                scope="https://www.googleapis.com/auth/calendar.readonly",
                description="View calendar events",
            ),
        ],
    ),
    OAuthIntegration(
        id="google_docs",
        name="Google Docs",
        description="Create and edit documents with AI assistance",
        icons=[
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Google_Docs_2020_Logo.svg/640px-Google_Docs_2020_Logo.svg.png"
        ],
        category="productivity",
        provider="google",
        scopes=[
            OAuthScope(
                scope="https://www.googleapis.com/auth/documents",
                description="Create and edit documents",
            ),
        ],
    ),
    OAuthIntegration(
        id="gmail",
        name="Gmail",
        description="Manage emails, compose messages, and organize your inbox",
        icons=[
            "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
        ],
        category="communication",
        provider="google",
        scopes=[
            OAuthScope(
                scope="https://www.googleapis.com/auth/gmail.modify",
                description="Read, compose, and send emails",
            ),
        ],
    ),
    OAuthIntegration(
        id="google_drive",
        name="Google Drive",
        description="Access and manage your files in the cloud",
        icons=[
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/640px-Google_Drive_icon_%282020%29.svg.png"
        ],
        category="storage",
        provider="google",
        scopes=[
            OAuthScope(
                scope="https://www.googleapis.com/auth/drive.file",
                description="Create and manage files",
            ),
        ],
    ),
    # Coming soon integrations
    OAuthIntegration(
        id="github",
        name="GitHub",
        description="Manage repositories, issues, and pull requests",
        icon="https://cdn.brandfetch.io/idZAyF9rlg/theme/light/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
        category="development",
        provider="github",
        scopes=[],
        available=False,
    ),
    OAuthIntegration(
        id="figma",
        name="Figma",
        description="Create and collaborate on design projects",
        icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
        category="creative",
        provider="figma",
        scopes=[],
        available=False,
    ),
    OAuthIntegration(
        id="notion",
        name="Notion",
        description="Manage pages, databases, and workspace content with AI",
        icon="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
        category="productivity",
        provider="notion",
        scopes=[],
        available=False,
    ),
    OAuthIntegration(
        id="whatsapp",
        name="WhatsApp",
        description="Send and receive messages",
        icon="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1024px-WhatsApp.svg.png?20220228223904",
        category="communication",
        provider="facebook",
        scopes=[],
        available=False,
    ),
]


def get_integration_by_id(integration_id: str) -> Optional[OAuthIntegration]:
    """Get an integration by its ID."""
    return next((i for i in OAUTH_INTEGRATIONS if i.id == integration_id), None)


def get_integrations_by_provider(provider: str) -> List[OAuthIntegration]:
    """Get all integrations for a specific provider."""
    return [i for i in OAUTH_INTEGRATIONS if i.provider == provider]


def get_available_integrations() -> List[OAuthIntegration]:
    """Get all available integrations."""
    return [i for i in OAUTH_INTEGRATIONS if i.available]


def get_integration_scopes(integration_id: str) -> List[str]:
    """Get the OAuth scopes for a specific integration."""
    integration = get_integration_by_id(integration_id)
    if not integration:
        return []
    return [scope.scope for scope in integration.scopes]


def get_unified_integrations() -> List[OAuthIntegration]:
    """Get all unified/special integrations."""
    return [i for i in OAUTH_INTEGRATIONS if i.is_special]


def get_individual_integrations() -> List[OAuthIntegration]:
    """Get all individual (non-unified) integrations."""
    return [i for i in OAUTH_INTEGRATIONS if not i.is_special]


def get_integrations_sorted_by_priority() -> List[OAuthIntegration]:
    """Get all integrations sorted by display priority (highest first)."""
    return sorted(OAUTH_INTEGRATIONS, key=lambda x: x.display_priority, reverse=True)


def is_integration_included_in_unified(integration_id: str, unified_id: str) -> bool:
    """Check if an integration is included in a unified integration."""
    unified = get_integration_by_id(unified_id)
    if not unified or not unified.is_special:
        return False
    return integration_id in unified.included_integrations


def get_included_integration_ids(unified_id: str) -> List[str]:
    """Get all integration IDs included in a unified integration."""
    unified = get_integration_by_id(unified_id)
    if not unified or not unified.is_special:
        return []
    return unified.included_integrations
