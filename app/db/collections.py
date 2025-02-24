"""
Module to expose commonly used MongoDB collections.
"""

from app.db.db_mongodb import mongodb_instance

# Expose collections via the MongoDB instance.
users_collection = mongodb_instance.get_collection("users")
conversations_collection = mongodb_instance.get_collection("conversations")
documents_collection = mongodb_instance.get_collection("documents")
goals_collection = mongodb_instance.get_collection("goals")
notes_collection = mongodb_instance.get_collection("notes")
calendars_collection = mongodb_instance.get_collection("calendar")
feedback_collection = mongodb_instance.get_collection("feedback_form")
waitlist_collection = mongodb_instance.get_collection("waitlist")
