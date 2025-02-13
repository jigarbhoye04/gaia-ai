from fastapi import HTTPException
from app.db.collections import documents_collection, notes_collection
from sentence_transformers import SentenceTransformer


async def search_notes_by_similarity(input_text: str, user_id: str):
    """
    Search for notes similar to the input text based on vector similarity.
    """
    # Step 1: Generate the embedding for the input text
    input_vector = generate_embedding(input_text)

    # Step 2: Search for notes based on vector similarity
    # This assumes you're using a vector index in MongoDB or a similar DB that supports vector search
    pipeline = [
        {
            "$vectorSearch": {
                "index": "notes_vector",  # Name of your vector index
                "path": "vector",  # Path where vectors are stored
                "queryVector": input_vector,  # The embedding of the input text
                "numCandidates": 100,  # You can adjust the number of candidates
                "limit": 5,  # Limit the number of results returned
            }
        },
        {
            "$match": {
                "user_id": user_id  # Make sure to filter results by the user ID
            }
        },
        {
            "$project": {
                "_id": 0,  # Don't include the MongoDB _id in the result
                "id": "$_id",  # Add the ID to the result
                "content": 1,  # Include the content of the note
                "plaintext": 1,  # Include the content of the note
                "user_id": 1,  # Include the user_id of the note
                "score": {
                    "$meta": "vectorSearchScore"
                },  # Include the vector search score
            }
        },
    ]

    # Step 3: Run the aggregation pipeline to fetch similar notes
    notes_result = await notes_collection.aggregate(pipeline).to_list(length=10)
    notes = [note["content"] for note in notes_result if note["score"] >= 0.6]

    # Step 4: Cache the result if needed (optional)
    # cache_key = f"similar_notes:{user_id}:{input_text[:20]}"  # Use a shortened version of the text for caching
    # await set_cache(cache_key, result)
    # print(result)
    return notes


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


class EmbeddingModel:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            cls._model = SentenceTransformer("all-MiniLM-L6-v2")
        return cls._model


embedding_model = EmbeddingModel.get_model()


def generate_embedding(text):
    return embedding_model.encode(text).tolist()
