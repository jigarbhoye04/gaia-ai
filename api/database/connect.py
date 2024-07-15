import sys
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
import pymongo

load_dotenv()
client = AsyncIOMotorClient(os.getenv("MONGO_DB"), server_api=ServerApi('1'))

database=client.get_database("GAIA")
users_collection = database.get_collection("users")
users_collection.create_index([('email', pymongo.ASCENDING)], unique=True)


def connect():
    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print("An Invalid URI host error was received. Is your Atlas host name correct in your connection string?")
        sys.exit(1)

