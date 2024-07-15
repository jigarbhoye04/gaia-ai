import bcrypt
from api.database.connect import database
from fastapi import HTTPException, status
from api.functionality.jwt import create_access_token, decode_jwt

def verify_password(plain_password: str, hashed_password:str ) -> bool:
    """Verify if the plain password matches the hashed password using bcrypt."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str):
    """Generate a hashed password with bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")


async def get_user(email: str) -> dict:
    """Check if user with this id exists."""
    try:
        users_collection = database.get_collection("users")
        found_user = await users_collection.find_one({"email": email})
        if found_user:
            return found_user
        else:
            return False
    except Exception:
        return False

async def authenticate_user(email:str, password:str):
    try:
        user = await get_user(email)
        if not user or not verify_password(password, user["hashed_password"]):
            return None
        else:
            del user["hashed_password"]
            return user

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# async def authorise_user(access_token, refresh_token):
#     try:
#         if not access_token or not refresh_token:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access / refresh token")
        
#         jwt_payload = decode_jwt(access_token)
            
#         if not jwt_payload:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
        
#         if jwt_payload["type"] != "access_token":
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        
#         token_expiration = datetime.fromtimestamp(jwt_payload["exp"], timezone.utc) # Convert string to appropriate time
#         if token_expiration < datetime.now(timezone.utc):   # If the access token has expired

#             refresh_jwt_payload = await check_refresh_valid(refresh_token=refresh_token)

#             if not refresh_jwt_payload:    
#                 raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is not valid")
            
#             if refresh_jwt_payload["type"] != "refresh_token":
#                 raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

#             user_id = jwt_payload["sub"]
#             user_id2 = refresh_jwt_payload["sub"]

#             # Access token & refresh token user id should match!
#             if user_id != user_id2:     
#                 raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token id does not match access token id")
         
#             new_access_token = create_access_token(user_id)
#             new_refresh_token = create_refresh_token(user_id)
#             await insert_delete_refresh_token_db(refresh_token, new_refresh_token)    # Delete old refresh token from db & insert new token

#             response = JSONResponse(content={"message": "Token refreshed."})

#             response.set_cookie(
#                 key="access_token",
#                 value=new_access_token,
#                 samesite="Lax",
#                 secure=True,
#                 httponly=True,
#                 expires=datetime.now(timezone.utc) + timedelta(days=60)
#             )
#             response.set_cookie(
#                 key="refresh_token",
#                 value=new_refresh_token,
#                 samesite="Lax",
#                 secure=True,
#                 httponly=True,
#                 expires=datetime.now(timezone.utc) + timedelta(days=60)
#             )
#             return response
        
#         return JSONResponse(content={"message": "Access token still valid."})
        
#     except HTTPException as httpexc:
#         raise httpexc
    
#     except Exception as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# async def insert_delete_refresh_token_db(oldtoken, newtoken):
#     try:
#         collection = database["refresh_tokens"]
#         delete_result = await collection.delete_one({"refresh_token":oldtoken})
#         insert_result = await collection.insert_one({"refresh_token":newtoken})

#         if insert_result.inserted_id and delete_result:
#             return True
#         else:
#             raise HTTPException(
#                 status_code=500, detail="Failed to insert & delete refresh token")

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to insert & delete refresh token {str(e)}")
    
# async def check_refresh_valid(refresh_token):
#     try:
#         if not refresh_token:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")
#         refresh_jwt_payload = decode_jwt(refresh_token)
#         if not refresh_jwt_payload:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

#         database = client["GAIA"]
#         collection = database["refresh_tokens"]
#         found_token = await collection.find_one({"refresh_token":refresh_token})

#         if not found_token:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found in store")

#         token_expiration = datetime.fromtimestamp(refresh_jwt_payload["exp"], timezone.utc)
#         if token_expiration < datetime.now(timezone.utc):  
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")
#         else:
#             return refresh_jwt_payload
        
#     except Exception:
#         return False