import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from google.oauth2 import id_token
from google.auth.transport import requests

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
ACCESS_TOKEN_SECRET_KEY = os.environ.get("ACCESS_TOKEN_SECRET_KEY", "access_secret")
REFRESH_TOKEN_SECRET_KEY = os.environ.get("REFRESH_TOKEN_SECRET_KEY", "refresh_secret")


def google_authenticate(google_token: str) -> dict:
    """
    Verify the Google JWT token using Google's OAuth2 library.

    Args:
        google_token (str): The JWT token received from the client.

    Returns:
        dict: The payload extracted from the Google token, including user info.

    Raises:
        Exception: If the Google token is invalid.
    """
    try:
        idinfo = id_token.verify_oauth2_token(google_token, requests.Request())
        # Optionally, verify the audience/client_id here.
        return {
            "sub": idinfo.get("sub"),
            "email": idinfo.get("email"),
            "email_verified": idinfo.get("email_verified"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
            "given_name": idinfo.get("given_name"),
        }
    except ValueError as e:
        raise Exception("Invalid Google token") from e


def create_access_token(user_data: dict) -> str:
    """
    Create a signed JWT access token with an expiration time.

    Args:
        user_data (dict): User data payload to include in the token.

    Returns:
        str: The signed JWT access token.
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = user_data.copy()
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, ACCESS_TOKEN_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_data: dict) -> str:
    """
    Create a signed JWT refresh token with an expiration time.

    Args:
        user_data (dict): User data payload to include in the token.

    Returns:
        str: The signed JWT refresh token.
    """
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = user_data.copy()
    payload.update({"exp": expire, "type": "refresh"})
    return jwt.encode(payload, REFRESH_TOKEN_SECRET_KEY, algorithm=ALGORITHM)


def create_tokens(user_data: dict) -> dict:
    """
    Create both access and refresh tokens for a given user.

    Args:
        user_data (dict): User data payload to include in the tokens.

    Returns:
        dict: A dictionary with keys 'access_token' and 'refresh_token'.
    """
    return {
        "access_token": create_access_token(user_data),
        "refresh_token": create_refresh_token(user_data),
    }


def verify_refresh_token(token: str) -> dict:
    """
    Verify the refresh token and return its payload if valid.

    Args:
        token (str): The JWT refresh token.

    Returns:
        dict: The payload contained within the refresh token.

    Raises:
        Exception: If the token is invalid or not of type 'refresh'.
    """
    try:
        payload = jwt.decode(token, REFRESH_TOKEN_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise Exception("Invalid token type")
        return payload
    except JWTError as e:
        raise Exception("Invalid refresh token") from e
