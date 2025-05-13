from functools import lru_cache
import sys

import pymongo
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

from app.config.loggers import mongo_logger as logger
from app.config.settings import settings


class MongoDB:
    """
    A class to manage the MongoDB connection using Motor.
    """

    def __init__(self, uri: str | None, db_name: str):
        """
        Initialize the MongoDB connection.

        Args:
            uri (str): MongoDB connection string.
            db_name (str): Name of the database.
        """
        if not uri:
            logger.error("MongoDB URI is not found in the environment variables.")
            sys.exit(1)

        try:
            self.client = AsyncIOMotorClient(uri, server_api=ServerApi("1"))
            self.database = self.client.get_database(db_name)
            self._initialize_indexes()

        except Exception as e:
            logger.error(f"An error occurred while connecting to MongoDB: {e}")
            sys.exit(1)

    def ping(self):
        try:
            self.client.admin.command("ping")
        except Exception as e:
            logger.error(f"Ping failed: {e}")

    def _initialize_indexes(self):
        try:
            users_collection = self.database.get_collection("users")
            users_collection.create_index([("email", pymongo.ASCENDING)], unique=True)

            mail_collection = self.database.get_collection("mail")
            mail_collection.create_index([("email_id", pymongo.ASCENDING)], unique=True)

        except Exception as e:
            logger.error(f"Error while initializing indexes: {e}")

    def get_collection(self, collection_name: str):
        return self.database.get_collection(collection_name)


@lru_cache(maxsize=1)
def init_mongodb():
    """
    Initialize MongoDB connection and set it in the app state.

    Args:
        app (FastAPI): The FastAPI application instance.
    """
    logger.info("Initializing MongoDB...")

    mongodb_instance = MongoDB(uri=settings.MONGO_DB, db_name="GAIA")
    logger.info("Created MongoDB instance")
    mongodb_instance.ping()
    logger.info("Successfully connected to MongoDB.")
    return mongodb_instance
