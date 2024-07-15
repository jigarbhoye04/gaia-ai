from fastapi import APIRouter, HTTPException, status, Request, FastAPI
from fastapi.responses import JSONResponse
from api.validators.auth import SignupData, LoginData
from api.functionality.authentication import get_password_hash, authenticate_user, authorise_user
from api.database.connect import users_collection
from api.functionality.jwt import create_access_token, create_refresh_token
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timedelta, timezone
from bson import json_util
from api.database.connect import client
import json

router = APIRouter()

@router.post("/signup")
async def signup(user: SignupData):
    """Endpoint to register a new user."""
    try:
        user_dict = user.dict()
        user_dict["hashed_password"] = get_password_hash(user.password.get_secret_value())
        del user_dict["password"]

        await users_collection.insert_one(user_dict)
        return JSONResponse(content={"response":"Successfully created a new account."})
    
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exist")
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/login")
async def login(user: LoginData):
    """Endpoint for a user to login."""

    user = await authenticate_user(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    try:

        access_token = create_access_token(user_id=str(user["_id"]))
        refresh_token = create_refresh_token(user_id=str(user["_id"]))

        database = client["gaia-cluster"]
        collection = database["refresh_tokens"]
        insert_result = await collection.insert_one({"refresh_token":refresh_token})

        if not insert_result.inserted_id:
            raise HTTPException(
                status_code=500, detail="Failed to insert & delete refresh token")
        
        response = JSONResponse(content=json.loads(json_util.dumps(user)))
        response.set_cookie(
            key="access_token",
            value=access_token,
            samesite="Lax",
            secure=True,
            httponly=True,
            expires=datetime.now(timezone.utc) + timedelta(days=60)
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            samesite="Lax",
            secure=True,
            httponly=True,
            expires=datetime.now(timezone.utc) + timedelta(days=60)
        )
        return response
    
    except HTTPException as httpexc:
        raise httpexc
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/refreshToken")
async def refresh_token(request: Request):
    try:
        access_token=request.cookies.get("access_token")
        refresh_token=request.cookies.get("refresh_token")
        return await authorise_user(access_token=access_token, refresh_token=refresh_token)

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error occurred: {str(e)}")
