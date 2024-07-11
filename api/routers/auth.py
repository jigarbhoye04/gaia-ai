from fastapi import APIRouter, HTTPException, status, Request
from fastapi.responses import JSONResponse
from api.validators.auth import SignupData, LoginData
from api.functionality.authentication import get_password_hash, authenticate_user
from api.database.connect import users_collection
from api.functionality.jwt import create_access_token, decode_jwt
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timedelta, timezone
from bson import json_util
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
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        access_token = create_access_token(user_id=str(user["_id"]))
        response = JSONResponse(content=json.loads(json_util.dumps(user)))
        response.set_cookie(
            key="access_token",
            value=access_token,
            samesite="Lax",
            secure=True,
            httponly=True,
            expires=datetime.now(timezone.utc) + timedelta(days=60)
        )
        # response.set_cookie(
        #     key="access_token",
        #     value=access_token,
        #     samesite="none",
        #     secure=False,
        #     httponly=True,
        #     expires=datetime.now(timezone.utc) + timedelta(days=60)
        # )
        return response
    
    except HTTPException as httpexc:
        raise httpexc
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/refreshToken")
def refresh_token(request: Request):
    try:
        access_token = request.cookies.get("access_token")

        if not access_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

        jwt_payload = decode_jwt(access_token)

        if not jwt_payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        token_expiration = datetime.fromtimestamp(jwt_payload["exp"], timezone.utc)

        if token_expiration < datetime.now(timezone.utc) + timedelta(minutes=5):
            user_id = jwt_payload["user_id"]
            new_access_token = create_access_token(user_id)
            response = JSONResponse(content={"message": "Token refreshed."})
            response.set_cookie(
                key="access_token",
                value=new_access_token,
                samesite="Lax",
                secure=True,
                httponly=True,
                expires=datetime.now(timezone.utc) + timedelta(days=60)
            )
            # response.set_cookie(
            #     key="access_token",
            #     value=new_access_token,
            #     samesite="none",
            #     secure=False,
            #     httponly=True,
            #     expires=datetime.now(timezone.utc) + timedelta(days=60)
            # )
            return response

        return JSONResponse(content={"message": "Access token still valid."})

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error occurred: {str(e)}")
