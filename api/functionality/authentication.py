import bcrypt
from api.database.connect import client
from pydantic import EmailStr
from fastapi import HTTPException, status

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

