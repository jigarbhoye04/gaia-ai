"""
Debug script to test semantic search for todos.
This script will help identify issues with todo indexing and searching.
"""

import asyncio
import sys
from datetime import datetime
from bson import ObjectId

# Add the app directory to the Python path
sys.path.insert(0, '/Users/aryan/Projects/GAIA/gaia-backend')

from app.db.chromadb import ChromaClient, init_chroma
from app.db.collections import todos_collection
from app.db.mongodb import connect_to_mongo
from app.config.settings import settings
from app.utils.todo_vector_utils import (
    create_todo_content_for_embedding,
    store_todo_embedding,
    semantic_search_todos
)


async def test_semantic_search():
    """Test semantic search functionality for todos."""
    
    print("1. Initializing database connections...")
    # Initialize MongoDB
    await connect_to_mongo()
    
    # Initialize ChromaDB
    await init_chroma()
    
    # Test user ID (you may need to adjust this to a real user ID)
    test_user_id = "test_user_123"
    
    print("\n2. Creating test todos...")
    # Create some test todos
    test_todos = [
        {
            "_id": ObjectId(),
            "user_id": test_user_id,
            "title": "Buy groceries for dinner",
            "description": "Need to get vegetables, fruits, and milk from the store",
            "priority": "high",
            "completed": False,
            "labels": ["shopping", "food"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "user_id": test_user_id,
            "title": "Complete Python project",
            "description": "Finish the semantic search feature for todos",
            "priority": "high",
            "completed": False,
            "labels": ["work", "programming"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "user_id": test_user_id,
            "title": "Schedule dentist appointment",
            "description": "Call Dr. Smith's office to book a cleaning",
            "priority": "medium",
            "completed": False,
            "labels": ["health"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Insert test todos into MongoDB
    for todo in test_todos:
        try:
            await todos_collection.insert_one(todo)
            print(f"  - Inserted todo: {todo['title']}")
        except Exception as e:
            print(f"  - Error inserting todo: {e}")
    
    print("\n3. Testing embedding generation...")
    # Test embedding generation for each todo
    for todo in test_todos:
        content = create_todo_content_for_embedding(todo)
        print(f"\n  Todo: {todo['title']}")
        print(f"  Embedding content: {content}")
        
        # Store embedding
        success = await store_todo_embedding(
            str(todo['_id']), 
            todo, 
            test_user_id
        )
        print(f"  Embedding stored: {success}")
    
    print("\n4. Testing ChromaDB collection...")
    # Get ChromaDB collection
    try:
        chroma_collection = await ChromaClient.get_langchain_client(
            collection_name="todos",
            create_if_not_exists=True
        )
        
        # Check collection contents
        collection_data = chroma_collection.get()
        print(f"  Total documents in collection: {len(collection_data['ids'])}")
        print(f"  Document IDs: {collection_data['ids'][:5]}...")  # Show first 5
        
    except Exception as e:
        print(f"  Error accessing ChromaDB collection: {e}")
    
    print("\n5. Testing semantic search...")
    # Test various search queries
    test_queries = [
        "groceries",
        "buy food",
        "shopping",
        "python programming",
        "dentist",
        "health appointment"
    ]
    
    for query in test_queries:
        print(f"\n  Query: '{query}'")
        try:
            results = await semantic_search_todos(
                query=query,
                user_id=test_user_id,
                top_k=5,
                include_traditional_search=False
            )
            print(f"  Results: {len(results)} found")
            for i, result in enumerate(results):
                print(f"    {i+1}. {result.title}")
        except Exception as e:
            print(f"  Error: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n6. Cleaning up test data...")
    # Clean up test todos
    for todo in test_todos:
        await todos_collection.delete_one({"_id": todo["_id"]})
        # Also delete from ChromaDB
        try:
            chroma_collection.delete(ids=[str(todo["_id"])])
        except:
            pass
    
    print("\nTest complete!")


if __name__ == "__main__":
    asyncio.run(test_semantic_search())