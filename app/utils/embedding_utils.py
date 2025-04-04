from functools import lru_cache
from bson import ObjectId
from fastapi import HTTPException
from app.db.collections import documents_collection, notes_collection, files_collection
from sentence_transformers import SentenceTransformer

from app.db.utils import serialize_document


@lru_cache(maxsize=1)
def get_embedding_model():
    """Lazy-load the SentenceTransformer model and cache it."""
    return SentenceTransformer("all-MiniLM-L6-v2")


async def search_notes_by_similarity(input_text: str, user_id: str, chromadb_client):
    """
    Search for notes similar to the input text based on vector similarity.
    Uses ChromaDB for similarity search and MongoDB to fetch complete note details.

    Args:
        input_text: The text to compare notes against
        user_id: The user ID whose notes to search
        chromadb_client: The ChromaDB client instance

    Returns:
        List of notes with their content and metadata
    """
    chroma_notes_collection = await chromadb_client.get_collection(name="notes")

    all_records = await chroma_notes_collection.get()
    print(f"{all_records=}")

    chroma_results = await chroma_notes_collection.query(
        query_texts=[input_text], n_results=5, where={"user_id": user_id}
    )

    print(f"{chroma_results=}")

    if (
        not chroma_results
        or not chroma_results.get("ids")
        or not chroma_results["ids"][0]
    ):
        return []

    note_ids = chroma_results["ids"][0]
    distances = chroma_results.get("distances", [[]])[0]

    similarity_scores = (
        {note_id: score for note_id, score in zip(note_ids, distances)}
        if distances
        else {}
    )

    # Step 3: Fetch complete note details from MongoDB using the IDs from ChromaDB
    result_notes = []
    if note_ids:
        object_ids = [ObjectId(id) for id in note_ids]
        mongo_query = {"_id": {"$in": object_ids}, "user_id": user_id}

        mongo_results = await notes_collection.find(mongo_query).to_list(
            length=len(note_ids)
        )

        for note in mongo_results:
            note_id = str(note.get("_id"))
            if note_id in similarity_scores:
                note["similarity_score"] = similarity_scores[note_id]

            serialized_note = serialize_document(note)
            result_notes.append(serialized_note)

        if result_notes:
            result_notes.sort(
                key=lambda x: x.get("similarity_score", 1.0), reverse=False
            )
    print(f"{result_notes=}")
    return result_notes


async def query_documents(query_text, conversation_id, user_id, top_k=5):
    """
    Query documents within a specific conversation ID and perform RAG.
    """
    try:
        # Generate embedding for the query text
        query_embedding = generate_embedding(query_text)

        # MongoDB aggregation pipeline for vector search within the conversation ID
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "document_vector",  # Name of your vector index
                    "path": "embedding",  # Path where embeddings are stored
                    "queryVector": query_embedding,  # Embedding of the input query
                    "numCandidates": 100,
                    "limit": top_k,
                }
            },
            {"$match": {"conversation_id": conversation_id, "user_id": user_id}},
            {
                "$project": {
                    "_id": 0,
                    "document_id": "$_id",
                    "title": 1,
                    "content": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]

        results = await documents_collection.aggregate(pipeline).to_list(length=top_k)

        # documents = [document for document in results if document["score"] >= 0.6]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def query_files(query_text, user_id, conversation_id=None, top_k=5):
    """
    Query files using vector similarity search.

    This function searches for files with embeddings similar to the query text.
    It can optionally filter by conversation_id.

    Args:
        query_text (str): The query text to search for
        user_id (str): The user ID to filter by
        conversation_id (str, optional): The conversation ID to filter by
        top_k (int): Maximum number of results to return

    Returns:
        list: Files matching the query with similarity scores
    """
    try:
        # Generate embedding for the query text
        query_embedding = generate_embedding(query_text)

        # Build match criteria
        match_criteria = {"user_id": user_id}
        if conversation_id:
            match_criteria["conversation_id"] = conversation_id

        # MongoDB aggregation pipeline for vector search of files
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "file_vector",  # Name of your vector index for files
                    "path": "embedding",  # Path where embeddings are stored
                    "queryVector": query_embedding,  # Embedding of the input query
                    "numCandidates": 100,
                    "limit": top_k,
                }
            },
            {"$match": match_criteria},
            {
                "$project": {
                    "_id": 0,
                    "file_id": 1,
                    "filename": 1,
                    "url": 1,
                    "content_type": 1,
                    "description": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]

        results = await files_collection.aggregate(pipeline).to_list(length=top_k)

        # Filter results with a minimum threshold
        filtered_results = [file for file in results if file.get("score", 0) >= 0.6]

        return filtered_results
    except Exception:
        return []


def generate_embedding(text):
    model = get_embedding_model()
    return model.encode(text).tolist()
