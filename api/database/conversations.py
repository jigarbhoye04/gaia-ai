from database.connect import database
from bson.objectid import ObjectId

convo_collection = database["conversations"]


def insert_message(conversation_id: str, description: str, user_id: ObjectId,  messages=[]):
    ...


def insert_conversation(conversation: dict, ):
    ...
