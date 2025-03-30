"""
Module to expose commonly used MongoDB collections.
"""

from app.db.db_mongodb import init_mongodb

mongodb_instance = init_mongodb()

users_collection = mongodb_instance.get_collection("users")
conversations_collection = mongodb_instance.get_collection("conversations")
documents_collection = mongodb_instance.get_collection("documents")
goals_collection = mongodb_instance.get_collection("goals")
notes_collection = mongodb_instance.get_collection("notes")
calendars_collection = mongodb_instance.get_collection("calendar")
feedback_collection = mongodb_instance.get_collection("feedback_form")
waitlist_collection = mongodb_instance.get_collection("waitlist")
mail_collection = mongodb_instance.get_collection("mail")
blog_collection = mongodb_instance.get_collection("blog")
about_collection = mongodb_instance.get_collection("about")
search_urls_collection = mongodb_instance.get_collection("search_urls")
files_collection = mongodb_instance.get_collection("files")
