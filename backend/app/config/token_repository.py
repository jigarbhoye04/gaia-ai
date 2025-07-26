"""
Token Repository for OAuth Tokens

This module provides centralized management for OAuth tokens using PostgreSQL via SQLAlchemy.
It handles token storage, retrieval, refreshing, and updates.
"""

import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from app.config.settings import settings
from app.db.postgresql import get_db_session
from app.models.oauth_models import OAuthToken
from authlib.integrations.starlette_client import OAuth
from authlib.oauth2.rfc6749 import OAuth2Token
from fastapi import HTTPException
from sqlalchemy import select, update


class TokenRepository:
    """Repository for managing OAuth tokens in PostgreSQL."""

    def __init__(self):
        """Initialize the token repository."""
        self.oauth = OAuth()

        # Configure OAuth clients
        self.oauth.register(
            name="google",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={
                "scope": "openid email profile",
                "prompt": "select_account",
            },
        )

        # Add more OAuth clients as needed (GitHub, Notion, etc.)

    async def store_token(
        self, user_id: str, provider: str, token_data: Dict[str, Any]
    ) -> None:
        """
        Store a new OAuth token in the database.

        Args:
            user_id: The ID of the user
            provider: The OAuth provider (google, github, etc.)
            token_data: The token data returned from OAuth provider
        """
        async with get_db_session() as session:
            # Check if a token already exists for this user and provider
            stmt = select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider
            )
            result = await session.execute(stmt)
            existing_token = result.scalar_one_or_none()

            # Convert token data to JSON string for storage
            token_json = json.dumps(token_data)

            # Calculate expiration time
            expires_at = None
            if "expires_in" in token_data:
                expires_at = datetime.now() + timedelta(
                    seconds=token_data["expires_in"]
                )

            if existing_token:
                # Update existing token
                await session.execute(
                    update(OAuthToken)
                    .where(OAuthToken.id == existing_token.id)
                    .values(
                        access_token=token_data.get("access_token"),
                        refresh_token=token_data.get("refresh_token")
                        or existing_token.refresh_token,
                        token_data=token_json,
                        expires_at=expires_at,
                        updated_at=datetime.now(),
                        scopes=token_data.get("scope", ""),
                    )
                )
            else:
                # Create new token
                new_token = OAuthToken(
                    user_id=user_id,
                    provider=provider,
                    access_token=token_data.get("access_token"),
                    refresh_token=token_data.get("refresh_token"),
                    token_data=token_json,
                    expires_at=expires_at,
                    scopes=token_data.get("scope", ""),
                )
                session.add(new_token)

            await session.commit()

    async def get_token(
        self, user_id: str, provider: str, renew_if_expired: bool = False
    ) -> OAuth2Token:
        """
        Retrieve a token for a user and provider.

        Args:
            user_id: The ID of the user
            provider: The OAuth provider (google, github, etc.)

        Returns:
            OAuth2Token or None if not found
        """
        async with get_db_session() as session:
            stmt = select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider
            )
            result = await session.execute(stmt)
            token_record = result.scalar_one_or_none()

            if not token_record:
                raise HTTPException(
                    status_code=401, detail="No authentication token found"
                )

            # Parse token data from JSON
            token_data = json.loads(token_record.token_data)

            oauth_token = OAuth2Token(
                params={
                    "access_token": token_record.access_token,
                    "refresh_token": token_record.refresh_token,
                    "token_type": token_data.get("token_type", "Bearer"),
                    "expires_at": int(token_record.expires_at.timestamp())
                    if token_record.expires_at
                    else None,
                }
            )

            # Check if token is expired
            if renew_if_expired and oauth_token.is_expired():
                # Token is expired, attempt to refresh it
                refreshed_token = await self.refresh_token(user_id, provider)
                if not refreshed_token:
                    raise HTTPException(
                        status_code=401, detail="No authentication token found"
                    )
                return refreshed_token

            return oauth_token

    async def update_token(
        self, user_id: str, provider: str, token: Dict[str, Any]
    ) -> None:
        """
        Update an existing token with new data (typically after refresh).

        Args:
            user_id: The ID of the user
            provider: The OAuth provider
            token: The new token data
        """
        await self.store_token(user_id, provider, token)

    async def refresh_token(self, user_id: str, provider: str) -> Optional[OAuth2Token]:
        """
        Refresh an OAuth token if it's expired.

        Args:
            user_id: The ID of the user
            provider: The OAuth provider

        Returns:
            The refreshed token or None if refresh fails
        """
        token = await self.get_token(user_id, provider)

        if not token or not token.get("refresh_token"):
            return None

        if not self.oauth.get:
            print("OAuth client not properly initialized.")
            return None

        client = self.oauth.get(provider)
        if not client:
            return None

        try:
            # Attempt to refresh the token
            new_token = await client.refresh_token(
                client.metadata.get("token_endpoint"),
                refresh_token=token.get("refresh_token"),
            )

            # Update the token in the database
            await self.update_token(user_id, provider, new_token)

            return OAuth2Token(new_token)
        except Exception as e:
            # Log the error and return None
            print(f"Error refreshing token: {e}")
            return None

    async def revoke_token(self, user_id: str, provider: str) -> bool:
        """
        Revoke an OAuth token.

        Args:
            user_id: The ID of the user
            provider: The OAuth provider

        Returns:
            True if token was successfully revoked, False otherwise
        """
        async with get_db_session() as session:
            stmt = select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider
            )
            result = await session.execute(stmt)
            token_record = result.scalar_one_or_none()

            if not token_record:
                return False

            # Delete the token
            await session.delete(token_record)
            await session.commit()

            return True

    async def get_authorized_scopes(self, user_id: str, provider: str) -> list[str]:
        """
        Get all authorized scopes for a user and provider.

        Args:
            user_id: The ID of the user
            provider: The OAuth provider

        Returns:
            List of authorized scope strings
        """
        async with get_db_session() as session:
            stmt = select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider
            )
            result = await session.execute(stmt)
            token_record = result.scalar_one_or_none()

            if not token_record or not token_record.scopes:
                return []

            return token_record.scopes.split()


# Singleton instance
token_repository = TokenRepository()
