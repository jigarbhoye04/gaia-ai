"""
Integration Token Repository

This module provides centralized management for integration OAuth tokens (Google, Slack, Notion, etc.)
using PostgreSQL via SQLAlchemy. It handles token storage, retrieval, refreshing, and updates for
third-party service integrations.

Note: User authentication via WorkOS is handled separately by the WorkOSAuthMiddleware.
"""

import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.config.settings import settings
from app.db.postgresql import get_db_session
from app.models.oauth_models import OAuthToken
from authlib.integrations.starlette_client import OAuth
from authlib.oauth2.rfc6749 import OAuth2Token
from fastapi import HTTPException
from sqlalchemy import select, update


class TokenRepository:
    """
    Repository for managing integration OAuth tokens in PostgreSQL.

    This class handles tokens for third-party integrations like Google, Slack, Notion, etc.
    It does NOT handle WorkOS authentication tokens, which are managed by WorkOSAuthMiddleware.
    """

    def __init__(self):
        """Initialize the token repository."""
        # Import logger here to avoid circular import
        from app.config.loggers import get_logger

        self.logger = get_logger(__name__)

        self.oauth = OAuth()

        # Initialize supported providers
        self._init_oauth_clients()

        self.logger.info(
            "Token repository initialized for managing API tokens (Google, etc.)"
        )

    def _init_oauth_clients(self):
        """Initialize OAuth clients for all supported providers."""
        # Google OAuth client
        if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
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
            self.logger.info("Google OAuth client registered")
        else:
            self.logger.warning(
                "Google OAuth credentials not found, client not registered"
            )

    async def store_token(
        self, user_id: str, provider: str, token_data: Dict[str, Any]
    ) -> None:
        """
        Store a new integration OAuth token in the database.

        Args:
            user_id: The ID of the user
            provider: The OAuth provider (google, slack, notion, etc.)
            token_data: The token data returned from OAuth provider
        """
        async with get_db_session() as session:
            # Check if a token already exists for this user and provider
            stmt = select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider
            )
            result = await session.execute(stmt)
            existing_token = result.scalar_one_or_none()

            # Get expiration time
            expires_at = None
            if "expires_in" in token_data:
                expires_at = datetime.now() + timedelta(
                    seconds=token_data["expires_in"]
                )

            # Store all token data as JSON for future reference/debugging
            token_json = json.dumps(token_data)

            if existing_token:
                # Update existing token
                await session.execute(
                    update(OAuthToken)
                    .where(OAuthToken.id == existing_token.id)
                    .values(
                        access_token=token_data.get("access_token"),
                        # Only update refresh token if a new one is provided
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
        Retrieve an integration token for a user and provider.

        Args:
            user_id: The ID of the user
            provider: The integration provider (google, slack, notion, etc.)
            renew_if_expired: Whether to attempt token refresh if expired

        Returns:
            OAuth2Token or None if not found
        """
        async with get_db_session() as session:
            # Query the token for this specific provider
            stmt = select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider
            )
            result = await session.execute(stmt)
            token_record = result.scalar_one_or_none()

            if not token_record:
                raise HTTPException(
                    status_code=401, detail=f"No {provider} token found for this user"
                )

            # Parse token data from JSON for additional fields
            token_data = json.loads(token_record.token_data)

            # Create OAuth2Token from the database record
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
                        status_code=401, detail=f"Failed to refresh {provider} token"
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
        Refresh an expired integration token.

        Args:
            user_id: The ID of the user
            provider: The integration provider (google, slack, notion, etc.)

        Returns:
            The refreshed OAuth2Token or None if it couldn't be refreshed
        """
        # Import logger here to avoid circular import
        from app.config.loggers import get_logger

        logger = get_logger(__name__)

        # Get the token record for this provider
        async with get_db_session() as session:
            stmt = select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider
            )
            result = await session.execute(stmt)
            token_record = result.scalar_one_or_none()

            if not token_record:
                logger.warning(
                    f"Cannot refresh token: No {provider} token found for user {user_id}"
                )
                return None

            # Check if refresh token is available
            refresh_token = token_record.refresh_token
            if not refresh_token:
                logger.warning(
                    f"Cannot refresh token: No refresh token for user {user_id} and provider {provider}"
                )
                return None

            # Configure the OAuth client based on the provider
            client = None
            if provider == "google":
                client = self.oauth.google
            else:
                # For future integrations like Slack, Notion, etc.
                logger.error(f"Provider {provider} not yet supported for token refresh")
                return None

            # Refresh the token
            try:
                # Only attempt to refresh if we have a valid client
                if not client:
                    logger.error(f"No OAuth client available for {provider}")
                    return None

                # Try to refresh the token using the provider's OAuth client
                logger.info(f"Refreshing {provider} token for user {user_id}")
                token = await client.refresh_token(refresh_token)

                if not token:
                    logger.error(
                        f"Failed to refresh {provider} token for user {user_id}"
                    )
                    return None

                # Parse existing token data
                token_data = json.loads(token_record.token_data)

                # Update token data with new values from the refreshed token
                token_data.update(
                    {
                        "access_token": token.access_token,
                        "token_type": token.token_type,
                        "scope": token.scope
                        if hasattr(token, "scope")
                        else token_data.get("scope", ""),
                    }
                )

                if hasattr(token, "expires_at"):
                    token_data["expires_at"] = token.expires_at

                # Calculate expiration time
                expires_at = None
                if hasattr(token, "expires_in"):
                    expires_at = datetime.now() + timedelta(seconds=token.expires_in)
                elif hasattr(token, "expires_at"):
                    expires_at = datetime.fromtimestamp(token.expires_at)

                # Update the token record with refreshed data
                await session.execute(
                    update(OAuthToken)
                    .where(OAuthToken.id == token_record.id)
                    .values(
                        access_token=token.access_token,
                        # Only update refresh token if a new one is provided
                        refresh_token=token.refresh_token
                        if hasattr(token, "refresh_token") and token.refresh_token
                        else token_record.refresh_token,
                        token_data=json.dumps(token_data),
                        expires_at=expires_at,
                        updated_at=datetime.now(),
                    )
                )
                await session.commit()

                logger.info(
                    f"Successfully refreshed {provider} token for user {user_id}"
                )
                return token
            except Exception as e:
                logger.error(f"Error refreshing {provider} token: {str(e)}")
                return None

    async def revoke_token(self, user_id: str, provider: str) -> bool:
        """
        Revoke an integration token.

        Args:
            user_id: The ID of the user
            provider: The integration provider (google, slack, notion, etc.)

        Returns:
            True if successful, False otherwise
        """
        # Import logger here to avoid circular import
        from app.config.loggers import get_logger

        logger = get_logger(__name__)

        async with get_db_session() as session:
            # Find the token for the specific provider
            stmt = select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider
            )
            result = await session.execute(stmt)
            token_record = result.scalar_one_or_none()

            if not token_record:
                logger.warning(
                    f"Cannot revoke token: No {provider} token found for user {user_id}"
                )
                return False

            try:
                # Delete the token record
                await session.delete(token_record)
                await session.commit()
                logger.info(f"Successfully revoked {provider} token for user {user_id}")
                return True
            except Exception as e:
                logger.error(f"Error revoking token: {str(e)}")
                await session.rollback()
                return False

    async def revoke_all_tokens(self, user_id: str) -> bool:
        """
        Revoke all integration tokens for a user.

        Args:
            user_id: The ID of the user

        Returns:
            True if successful, False otherwise
        """
        # Import logger here to avoid circular import
        from app.config.loggers import get_logger

        logger = get_logger(__name__)

        async with get_db_session() as session:
            # Find all tokens for this user
            stmt = select(OAuthToken).where(OAuthToken.user_id == user_id)
            result = await session.execute(stmt)
            tokens = result.scalars().all()

            if not tokens:
                logger.warning(f"No tokens found for user {user_id}")
                return True  # Consider it success if there's nothing to delete

            try:
                # Delete all token records for this user
                for token in tokens:
                    await session.delete(token)

                await session.commit()
                logger.info(f"Successfully revoked all tokens for user {user_id}")
                return True
            except Exception as e:
                logger.error(f"Error revoking all tokens: {str(e)}")
                await session.rollback()
                return False

    async def get_authorized_scopes(self, user_id: str, provider: str) -> List[str]:
        """
        Get all authorized scopes for a user and provider.

        Args:
            user_id: The ID of the user
            provider: The OAuth provider (google, slack, etc.)

        Returns:
            List of authorized scope strings
        """
        # Import logger here to avoid circular import
        from app.config.loggers import get_logger

        logger = get_logger(__name__)

        async with get_db_session() as session:
            # Query the specific provider token
            stmt = select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider
            )
            result = await session.execute(stmt)
            token_record = result.scalar_one_or_none()

            if not token_record:
                logger.warning(f"No {provider} token found for user {user_id}")
                return []

            # Get scopes from the token record
            if not token_record.scopes:
                # Try to get scopes from token data
                try:
                    token_data = json.loads(token_record.token_data)
                    scope = token_data.get("scope", "")
                    if scope:
                        return scope.split()
                except Exception as e:
                    logger.error(f"Error parsing token data: {str(e)}")
                return []

            # Return scopes from the token record
            return token_record.scopes.split()

    async def list_user_tokens(self, user_id: str) -> Dict[str, Any]:
        """
        List all available tokens and their providers for a user.

        Args:
            user_id: The ID of the user

        Returns:
            Dictionary with information about the user's tokens
        """
        result = {
            "user_id": user_id,
            "available_providers": [],
            "token_count": 0,
            "tokens": [],
        }

        async with get_db_session() as session:
            # Find all tokens for this user
            stmt = select(OAuthToken).where(OAuthToken.user_id == user_id)
            query_result = await session.execute(stmt)
            tokens = query_result.scalars().all()

            # Populate token information
            providers = []
            token_details = []

            for token in tokens:
                providers.append(token.provider)

                # Get token expiration info
                expires_at_str = None
                if token.expires_at:
                    expires_at_str = token.expires_at.isoformat()

                # Add token details
                token_details.append(
                    {
                        "id": token.id,
                        "provider": token.provider,
                        "has_refresh_token": bool(token.refresh_token),
                        "expires_at": expires_at_str,
                        "scopes": token.scopes.split() if token.scopes else [],
                        "updated_at": token.updated_at.isoformat()
                        if token.updated_at
                        else None,
                    }
                )

            result["available_providers"] = providers
            result["token_count"] = len(tokens)
            result["tokens"] = token_details

        return result


# Singleton instance
token_repository = TokenRepository()
