import sys
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
import pymongo

load_dotenv()

# Load and verify URI
URI = os.getenv("MONGO_DB")
if not URI:
    print("MongoDB URI is not found in the environment variables.")
    sys.exit(1)

# Connect to MongoDB
client = AsyncIOMotorClient(URI, server_api=ServerApi("1"))

# Select database and collection
database = client.get_database("GAIA")
users_collection = database.get_collection("users")
conversations_collection = database.get_collection("conversations")

# Create unique index on email field
users_collection.create_index([("email", pymongo.ASCENDING)], unique=True)

# Create unique index on user_id field for each vonersations
conversations_collection.create_index([("user_id", pymongo.ASCENDING)], unique=True)


def connect():
    try:
        client.admin.command("ping")
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
