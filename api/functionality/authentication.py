import bcrypt
import base64
import hashlib
from api.database.connect import client
from pydantic import EmailStr

def verify_password(plain_password, hashed_password):
    """Verify if the plain password matches the hashed password using bcrypt."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    """Generate a hashed password with bcrypt."""
    return (bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())).decode('utf-8') 

async def check_user_exists(email: EmailStr):
    """Check if user with this email exists."""

    try:
        db = client.get_database("auth")
        users_collection = db.get_collection("users")

        found_user = await users_collection.find_one({"email":email})
        print(found_user)

        return True if found_user else False
    
    except Exception as e:
        return True
    