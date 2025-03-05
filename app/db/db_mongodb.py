import sys
from app.utils.logging_util import get_logger
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import pymongo
from app.config.settings import settings


logger = get_logger(name="database", log_file="database.log")


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
            self._ping()
        except Exception as e:
            logger.error(f"An error occurred while connecting to MongoDB: {e}")
            sys.exit(1)

    def _ping(self):
        """
        Ping the MongoDB server to confirm connection.
        """
        try:
            self.client.admin.command("ping")
            logger.info(
                "Pinged your deployment. You successfully connected to MongoDB!"
            )
        except Exception as e:
            logger.error(f"Ping failed: {e}")

    def _initialize_indexes(self):
        """
        Create necessary indexes on collections.
        """
        try:
            users_collection = self.database.get_collection("users")
            # Create a unique index on the 'email' field
            users_collection.create_index([("email", pymongo.ASCENDING)], unique=True)
            logger.info("Created index on 'users' collection for the 'email' field.")
            # Additional indexes for other collections can be added here.
        except Exception as e:
            logger.error(f"Error while initializing indexes: {e}")

    def get_collection(self, collection_name: str):
        """
        Get a specific collection from the database.

        Args:
            collection_name (str): The name of the collection.

        Returns:
            Collection: The MongoDB collection.
        """
        return self.database.get_collection(collection_name)


db_uri = settings.MONGO_DB
db_name = "GAIA"
mongodb_instance = MongoDB(uri=db_uri, db_name=db_name)
