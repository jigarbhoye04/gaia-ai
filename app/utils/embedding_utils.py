from functools import lru_cache
from bson import ObjectId
from app.db.collections import notes_collection, files_collection
from sentence_transformers import SentenceTransformer
from app.config.loggers import chat_logger as logger
from app.db.utils import serialize_document


@lru_cache(maxsize=1)
def get_embedding_model():
    """Lazy-load the SentenceTransformer model and cache it."""
    return SentenceTransformer("all-MiniLM-L6-v2")


async def search_notes_by_similarity(input_text: str, user_id: str, chromadb_client):
    """
    Search for notes similar to the input text based on vector similarity.
    Uses ChromaDB for similarity search, only falling back to MongoDB for complete note details.

    Args:
        input_text: The text to compare notes against
        user_id: The user ID whose notes to search
        chromadb_client: The ChromaDB client instance

    Returns:
        List of notes with their content and metadata
    """
    try:
        # Get notes collection from ChromaDB
        chroma_notes_collection = await chromadb_client.get_collection(name="notes")

        # Use proper filter structure for ChromaDB with $eq operator
        where_filter = {"user_id": {"$eq": user_id}}

        # Query ChromaDB for similar notes
        chroma_results = await chroma_notes_collection.query(
            query_texts=[input_text], n_results=5, where=where_filter
        )

        if (
            not chroma_results
            or not chroma_results.get("ids")
            or not chroma_results["ids"][0]
        ):
            return []

        # Extract note IDs, similarity scores, and content
        note_ids = chroma_results["ids"][0]
        distances = chroma_results.get("distances", [[]])[0]
        contents = chroma_results.get("documents", [[]])[0]
        metadatas = chroma_results.get("metadatas", [[]])[0]

        # Create a mapping of note IDs to similarity scores
        # similarity_scores = (
        # {note_id: score for note_id, score in zip(note_ids, distances)}
        # if distances
        # else {}
        # )

        # Create result notes with data from ChromaDB
        result_notes = []

        for i, note_id in enumerate(note_ids):
            if i < len(distances) and i < len(metadatas):
                # Create basic note information from ChromaDB data
                note = {
                    "_id": note_id,
                    "similarity_score": distances[i],
                    "user_id": metadatas[i].get("user_id", ""),
                    "title": metadatas[i].get("title", ""),
                    "content": contents[i] if i < len(contents) else "",
                }

                # Get complete note details from MongoDB
                try:
                    mongo_note = await notes_collection.find_one(
                        {"_id": ObjectId(note_id), "user_id": user_id}
                    )
                    if mongo_note:
                        # Add additional fields from MongoDB
                        note["created_at"] = (
                            mongo_note.get("created_at", "").isoformat()
                            if hasattr(mongo_note.get("created_at", ""), "isoformat")
                            else ""
                        )
                        note["updated_at"] = (
                            mongo_note.get("updated_at", "").isoformat()
                            if hasattr(mongo_note.get("updated_at", ""), "isoformat")
                            else ""
                        )
                        note["folder"] = mongo_note.get("folder", "")
                        note["tags"] = mongo_note.get("tags", [])

                    serialized_note = serialize_document(note)
                    result_notes.append(serialized_note)
                except Exception as mongo_err:
                    # Log but continue with basic info if MongoDB lookup fails
                    logger.error(
                        f"Error fetching complete note data from MongoDB: {str(mongo_err)}"
                    )
                    serialized_note = serialize_document(note)
                    result_notes.append(serialized_note)

        # Sort by similarity score (lower is better)
        if result_notes:
            result_notes.sort(
                key=lambda x: x.get("similarity_score", 1.0), reverse=False
            )

        return result_notes
    except Exception as e:
        logger.error(f"Error searching notes in ChromaDB: {str(e)}", exc_info=True)
        return []


async def query_documents(query_text, conversation_id, user_id, top_k=5):
    """
    Query documents within a specific conversation ID using ChromaDB.
    """
    try:
        from app.main import app

        chromadb_client = app.state.chroma_client

        # Use search_documents_by_similarity which already implements ChromaDB search
        return await search_documents_by_similarity(
            input_text=query_text,
            user_id=user_id,
            chromadb_client=chromadb_client,
            conversation_id=conversation_id,
            top_k=top_k,
        )
    except Exception as e:
        logger.error(f"Error querying documents with ChromaDB: {str(e)}", exc_info=True)
        return []


async def query_files(query_text, user_id, conversation_id=None, top_k=5):
    """
    Query files using ChromaDB vector similarity search.

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
        from app.main import app

        chromadb_client = app.state.chroma_client

        # Use search_documents_by_similarity which already implements ChromaDB search for files
        results = await search_documents_by_similarity(
            input_text=query_text,
            user_id=user_id,
            chromadb_client=chromadb_client,
            conversation_id=conversation_id,
            top_k=top_k,
        )

        # Format the results to match the expected structure
        for file in results:
            # Rename similarity_score to score for backward compatibility
            if "similarity_score" in file:
                file["score"] = file["similarity_score"]

        # Apply the same threshold filter that was used in the MongoDB implementation
        filtered_results = [file for file in results if file.get("score", 0) >= 0.6]

        return filtered_results
    except Exception as e:
        logger.error(f"Error querying files with ChromaDB: {str(e)}", exc_info=True)
        return []


def generate_embedding(text):
    model = get_embedding_model()
    return model.encode(text).tolist()


async def search_documents_by_similarity(
    input_text: str,
    user_id: str,
    chromadb_client,
    conversation_id: str = None,
    top_k: int = 5,
):
    """
    Search for documents similar to the input text using ChromaDB vector similarity.

    Args:
        input_text: The text to compare documents against
        user_id: The user ID whose documents to search
        chromadb_client: The ChromaDB client instance
        conversation_id: Optional conversation ID to further filter results
        top_k: Maximum number of results to return

    Returns:
        List of documents with their content and metadata
    """
    try:
        # Verify ChromaDB client is available and responsive
        if not chromadb_client:
            logger.warning("ChromaDB client not provided, returning empty results")
            return []

        try:
            # Test connection with a lightweight operation
            await chromadb_client.heartbeat()
        except Exception as conn_err:
            logger.error(f"ChromaDB connection error: {str(conn_err)}")
            return []

        # Get documents collection
        try:
            chroma_documents_collection = await chromadb_client.get_collection(
                name="documents"
            )
        except Exception as coll_err:
            logger.error(
                f"Failed to get ChromaDB 'documents' collection: {str(coll_err)}"
            )
            return []

        # Prepare where filter with proper operator structure for ChromaDB
        # Use $and operator to combine multiple conditions
        where_conditions = []

        # Add user_id condition
        where_conditions.append({"user_id": {"$eq": user_id}})

        # Add conversation_id condition if provided
        if conversation_id:
            where_conditions.append({"conversation_id": {"$eq": conversation_id}})

        # Use $and to combine conditions if we have more than one
        where_filter = (
            where_conditions[0]
            if len(where_conditions) == 1
            else {"$and": where_conditions}
        )

        # Query ChromaDB for similar documents
        chroma_results = await chroma_documents_collection.query(
            query_texts=[input_text], n_results=top_k, where=where_filter
        )

        if (
            not chroma_results
            or not chroma_results.get("ids")
            or not chroma_results["ids"][0]
        ):
            return []

        # Extract document IDs, similarity scores, document content and metadata
        document_ids = chroma_results["ids"][0]
        distances = chroma_results.get("distances", [[]])[0]
        documents = chroma_results.get("documents", [[]])[0]
        metadatas = chroma_results.get("metadatas", [[]])[0]

        # Create result documents directly from ChromaDB data
        result_documents = []

        for i, doc_id in enumerate(document_ids):
            if i < len(distances) and i < len(metadatas):
                # We can create basic document information directly from ChromaDB
                doc = {
                    "file_id": doc_id,
                    "similarity_score": distances[i],
                    "user_id": metadatas[i].get("user_id", ""),
                    "filename": metadatas[i].get("filename", ""),
                    "type": metadatas[i].get("type", ""),
                    "description": documents[i] if i < len(documents) else "",
                }

                # We still need to fetch the complete file data from MongoDB
                # since ChromaDB doesn't store all metadata
                try:
                    mongo_doc = await files_collection.find_one(
                        {"file_id": doc_id, "user_id": user_id}
                    )
                    if mongo_doc:
                        # Add additional fields from MongoDB
                        doc["url"] = mongo_doc.get("url", "")
                        doc["public_id"] = mongo_doc.get("public_id", "")
                        doc["created_at"] = (
                            mongo_doc.get("created_at", "").isoformat()
                            if hasattr(mongo_doc.get("created_at", ""), "isoformat")
                            else ""
                        )
                        doc["updated_at"] = (
                            mongo_doc.get("updated_at", "").isoformat()
                            if hasattr(mongo_doc.get("updated_at", ""), "isoformat")
                            else ""
                        )

                        # Convert ObjectId to string
                        if "_id" in mongo_doc:
                            doc["_id"] = str(mongo_doc["_id"])

                    result_documents.append(doc)
                except Exception as mongo_err:
                    # Log but continue with basic info if MongoDB lookup fails
                    logger.error(
                        f"Error fetching complete file data from MongoDB: {str(mongo_err)}"
                    )
                    result_documents.append(doc)

        # Sort by similarity score (lower is better)
        if result_documents:
            result_documents.sort(
                key=lambda x: x.get("similarity_score", 1.0), reverse=False
            )

        return result_documents

    except Exception as e:
        logger.error(f"Error searching documents in ChromaDB: {str(e)}", exc_info=True)
        return []
