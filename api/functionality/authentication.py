import bcrypt
from api.database.connect import client
from pydantic import EmailStr
from fastapi import HTTPException, status, Request
from api.functionality.jwt import create_access_token, decode_jwt
from datetime import datetime, timedelta, timezone
from fastapi.responses import JSONResponse

def verify_password(plain_password, hashed_password):
    """Verify if the plain password matches the hashed password using bcrypt."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    """Generate a hashed password with bcrypt."""
    return (bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())).decode('utf-8') 

async def check_user_exists(email: EmailStr):
    """Check if user with this email exists."""
    try:
        db = client.get_database("GAIA")
        users_collection = db.get_collection("Users")
        found_user = await users_collection.find_one({"email":email})
        return found_user if found_user else False
    except Exception:
        return True
    

async def authenticate_user(user):
    user_dict = user.dict()
    email = user_dict.get("email")
    password = user_dict.get("password").get_secret_value()

    try:
        user_found = await check_user_exists(email)
        if not user_found or not verify_password(password, user_found.get("hashed_password")):
            return None
        return user_found
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


async def check_user_valid(request: Request):
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

    except Exception as e:
        ...

async def refresh_token(jwt):
    ...