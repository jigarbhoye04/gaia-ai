import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import pymongo
from dotenv import load_dotenv

load_dotenv()


class MongoDB:
    def __init__(self, uri: str, db_name: str):
        if not uri:
            print(uri)
            print("MongoDB URI is not found in the environment variables.")
            sys.exit(1)

        try:
            self.client = AsyncIOMotorClient(uri, server_api=ServerApi("1"))
            self.database = self.client.get_database(db_name)
            self._initialize_indexes()
            self._ping()
        except Exception as e:
            print(f"An error occurred while connecting to MongoDB: {e}")
            sys.exit(1)

    def _ping(self):
        """Ping the MongoDB server to confirm connection."""
        self.client.admin.command("ping")
        print("Pinged your deployment. You successfully connected to MongoDB!")

    def _initialize_indexes(self):
        """Create necessary indexes on collections."""
        users_collection = self.database.get_collection("users")
        users_collection.create_index([("email", pymongo.ASCENDING)], unique=True)

        # conversations_collection = self.database.get_collection("conversations")
        # conversations_collection.create_index(
        #     [("user_id", pymongo.ASCENDING)], unique=True
        # )
        # conversations_collection.drop_index([("user_id", pymongo.ASCENDING)])

    def get_collection(self, collection_name: str):
        """Get a specific collection."""
        return self.database.get_collection(collection_name)


# Initialize the MongoDB connection
database = MongoDB(uri=os.getenv("MONGO_DB"), db_name="GAIA")

users_collection = database.get_collection("users")
conversations_collection = database.get_collection("conversations")
conversations_collection.drop_indexes()
documents_collection = database.get_collection("documents")
document_chunks_collection = database.get_collection("document_chunks")
goals_collection = database.get_collection("goals")
notes_collection = database.get_collection("notes")


def serialize_document(document):
    document["id"] = str(document.pop("_id"))
    return document
