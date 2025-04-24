"""
Service module for file upload functionality with vector search capabilities.
"""

import io
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile
from langchain_core.documents import Document

from app.config.loggers import app_logger as logger
from app.db.chromadb import ChromaClient
from app.db.collections import files_collection
from app.db.utils import serialize_document
from app.models.message_models import FileData
from app.utils.embedding_utils import generate_embedding, search_documents_by_similarity
from app.utils.file_utils import generate_file_description


async def upload_file_service(
    file: UploadFile,
    user_id: str,
    conversation_id: Optional[str] = None,
) -> dict:
    """
    Upload a file to Cloudinary, generate embeddings, and store metadata in MongoDB and ChromaDB.

    Args:
        file (UploadFile): The file to upload
        user_id (str): The ID of the user uploading the file
        conversation_id (str, optional): The conversation ID to associate with the file

    Returns:
        dict: File metadata including fileId and url

    Raises:
        HTTPException: If file upload fails
    """
    try:
        content = await file.read()

        file_id = str(uuid.uuid4())
        public_id = f"file_{file_id}_{file.filename.replace(' ', '_')}"

        upload_result = cloudinary.uploader.upload(
            io.BytesIO(content),
            resource_type="auto",
            public_id=public_id,
            overwrite=True,
        )

        file_url = upload_result.get("secure_url")
        if not file_url:
            logger.error("Missing secure_url in Cloudinary upload response")
            raise HTTPException(
                status_code=500, detail="Invalid response from file upload service"
            )

        file_description = generate_file_description(
            content, file_url, file.content_type, file.filename
        )
        logger.info(f"Generated description for file {file_id}")

        current_time = datetime.now(timezone.utc)
        file_metadata = {
            "file_id": file_id,
            "filename": file.filename,
            "type": file.content_type,
            "size": len(content),
            "url": file_url,
            "public_id": public_id,
            "user_id": user_id,
            "description": file_description,
            "created_at": current_time,
            "updated_at": current_time,
        }

        if conversation_id:
            file_metadata["conversation_id"] = conversation_id

        # Store in MongoDB
        result = await files_collection.insert_one(file_metadata)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to store file metadata")

        # Store in ChromaDB if embedding was generated
        try:
            chroma_documents_collection = await ChromaClient.get_langchain_client(
                collection_name="documents"
            )

            # Store document metadata in ChromaDB
            await chroma_documents_collection.aadd_documents(
                ids=[file_id],
                documents=[
                    Document(
                        page_content=file_description,
                        metadata={
                            "file_id": file_id,
                            "user_id": user_id,
                            "filename": file.filename,
                            "type": file.content_type,
                        },
                    )
                ],
            )
            logger.info(f"File with id {file_id} indexed in ChromaDB")
        except Exception as chroma_err:
            # Log but don't fail if ChromaDB indexing fails
            logger.error(
                f"Failed to index file in ChromaDB: {str(chroma_err)}",
                exc_info=True,
            )

        logger.info(f"File uploaded successfully. ID: {file_id}, URL: {file_url}")

        return {
            "fileId": file_id,
            "url": file_url,
            "filename": file.filename,
            "description": file_description,
            "type": file.content_type,
        }

    except Exception as e:
        logger.error(f"Failed to upload file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


async def fetch_files(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch file data based on fileIds in the request, perform RAG with vector search,
    and add relevant file information to the message context.

    This pipeline step:
    1. Processes explicit file IDs provided in the request
    2. Uses fileData if available to avoid redundant database lookups
    3. Performs vector similarity search to find relevant files based on the query
    4. Formats and adds the file information to the message context

    Args:
        context (Dict[str, Any]): The pipeline context containing request data

    Returns:
        Dict[str, Any]: Updated context with file data added
    """

    user_id = context.get("user_id")
    if not user_id:
        return context

    conversation_id = context.get("conversation_id")
    query_text = context.get("query_text", "")
    last_message = context.get("last_message")

    # Check if the last message is empty or not
    if not last_message:
        context["files_added"] = False
        return context

    try:
        # Track files to include in the response
        included_files = []

        # Get explicit file IDs and file data from context
        explicit_file_ids = context.get("fileIds", [])
        file_data_list: List[FileData] = context.get("fileData", [])

        # Create a mapping of file IDs to their complete metadata from fileData
        file_data_map = {
            file_data.fileId: file_data.model_dump() for file_data in file_data_list
        }

        if explicit_file_ids:
            logger.info(f"Fetching {len(explicit_file_ids)} files by ID")

            # Find which IDs aren't in the file_data_map
            missing_ids = [
                file_id for file_id in explicit_file_ids if file_id not in file_data_map
            ]

            # Process files from file_data_map
            for file_id in explicit_file_ids:
                if file_id in file_data_map:
                    file_data = file_data_map[file_id]
                    included_files.append(
                        {
                            "file_id": file_data["fileId"],
                            "url": file_data["url"],
                            "filename": file_data["filename"],
                            "description": file_data.get("description", ""),
                            "content_type": file_data.get("content_type", ""),
                            "_id": file_data[
                                "fileId"
                            ],  # Use fileId as _id for consistency
                        }
                    )

            # Batch lookup missing files from database
            if missing_ids:
                db_files = await files_collection.find(
                    {"file_id": {"$in": missing_ids}}
                ).to_list(length=None)

                for file_data in db_files:
                    # Convert ObjectId to string for serialization
                    if "_id" in file_data:
                        file_data["_id"] = str(file_data["_id"])

                    # Convert date fields to ISO format
                    for date_field in ["created_at", "updated_at"]:
                        if date_field in file_data and hasattr(
                            file_data[date_field], "isoformat"
                        ):
                            file_data[date_field] = file_data[date_field].isoformat()

                    included_files.append(
                        {
                            "file_id": file_data["file_id"],
                            "url": file_data["url"],
                            "filename": file_data["filename"],
                            "description": file_data.get("description", ""),
                            "content_type": file_data.get("content_type", ""),
                            "_id": file_data[
                                "file_id"
                            ],  # Use file_id as _id for consistency
                        }
                    )

        # 2. Perform vector search for relevant files based on the query
        # Only perform the search if there's a meaningful query
        if len(query_text) > 3:
            relevant_files = []

            # Use ChromaDB for vector search
            try:
                # Search documents using ChromaDB
                relevant_files = await search_documents_by_similarity(
                    input_text=query_text,
                    user_id=user_id,
                    conversation_id=conversation_id,
                    top_k=5,
                )

                # Format the results to match the expected structure
                for file in relevant_files:
                    file["score"] = file.get("similarity_score", 0)
            except Exception as e:
                logger.error(
                    f"Error searching documents with ChromaDB: {str(e)}", exc_info=True
                )
                relevant_files = []

            if relevant_files:
                logger.info(f"Found {len(relevant_files)} semantically relevant files")

                # Add relevant files that weren't already included via explicit IDs
                for file in relevant_files:
                    file_id = file.get("file_id")
                    if file_id not in [f.get("file_id") for f in included_files]:
                        included_files.append(
                            {
                                "file_id": file_id,
                                "url": file.get("url"),
                                "filename": file.get("filename"),
                                "description": file.get("description", ""),
                                "content_type": file.get("content_type", ""),
                                "_id": file_id,  # Use file_id as _id for consistency
                            }
                        )
                logger.info(f"Added {len(relevant_files)} semantically relevant files")

        # 3. Format and add file information to the message context
        if included_files:
            # Separate explicit files from semantic search results
            explicit_files = [
                f for f in included_files if f.get("file_id") in explicit_file_ids
            ]
            semantic_files = [
                f for f in included_files if f.get("file_id") not in explicit_file_ids
            ]

            # Format file information for the message context
            formatted_files = "\n\n## File Information\n\n"

            # Include explicitly requested files first
            if explicit_files:
                formatted_files += "### Uploaded Files\n\n"
                for file in explicit_files:
                    filename = file.get("filename", "Unnamed file")
                    file_type = file.get("content_type", "Unknown type")
                    description = file.get("description", "No description available")

                    formatted_files += f"**{filename}** ({file_type})\n"
                    formatted_files += f"{description}\n\n"

            if semantic_files:
                formatted_files += "### Relevant Files\n\n"
                for file in semantic_files:
                    filename = file.get("filename", "Unnamed file")
                    file_type = file.get("content_type", "Unknown type")
                    description = file.get("description", "No description available")
                    relevance = file.get("relevance_score", 0)

                    formatted_files += (
                        f"**{filename}** ({file_type}) - Relevance: {relevance:.2f}\n"
                    )
                    formatted_files += f"{description}\n\n"

            # Add the file information to the message context
            context["last_message"]["content"] += formatted_files
            context["files_data"] = included_files
            context["files_added"] = True
            logger.info(f"Added {len(included_files)} files to message context")
        else:
            context["files_added"] = False
            logger.info("No relevant files found")

    except Exception as e:
        logger.error(f"Error processing files: {str(e)}", exc_info=True)
        context["files_added"] = False
        context["file_error"] = str(e)

    return context


async def delete_file_service(file_id: str, user_id: Optional[str]) -> dict:
    """
    Delete a file by its ID for the specified user.
    Removes the file from MongoDB, Cloudinary, and ChromaDB.

    Args:
        file_id (str): The ID of the file to delete
        user_id (Optional[str]): The ID of the authenticated user

    Returns:
        dict: Success message with deleted file information

    Raises:
        HTTPException: If the file is not found or deletion fails
    """
    logger.info(f"Deleting file with id: {file_id} for user: {user_id}")

    if user_id is None:
        logger.error("User ID is required to delete a file")
        raise HTTPException(status_code=400, detail="User ID is required")

    # Retrieve file metadata before deletion
    file_data = await files_collection.find_one(
        {"file_id": file_id, "user_id": user_id}
    )
    if not file_data:
        logger.error(f"File with id {file_id} not found for user {user_id}")
        raise HTTPException(status_code=404, detail="File not found")

    # Get the public_id for cloudinary deletion
    public_id = file_data.get("public_id")
    if not public_id:
        logger.warning(f"File {file_id} has no public_id for Cloudinary deletion")

    # Delete from MongoDB
    result = await files_collection.delete_one({"file_id": file_id, "user_id": user_id})
    if result.deleted_count == 0:
        logger.error("File not found for deletion in MongoDB")
        raise HTTPException(status_code=404, detail="File not found")

    # Delete from Cloudinary if public_id exists
    if public_id:
        try:
            cloudinary_result = cloudinary.uploader.destroy(public_id)
            if cloudinary_result.get("result") != "ok":
                logger.warning(
                    f"Failed to delete file from Cloudinary: {cloudinary_result}"
                )
        except Exception as e:
            # Log but don't fail if Cloudinary deletion fails
            logger.error(
                f"Error deleting file from Cloudinary: {str(e)}", exc_info=True
            )

    try:
        chroma_documents_collection = await ChromaClient.get_langchain_client(
            collection_name="documents"
        )
        await chroma_documents_collection.adelete(ids=[file_id])
        logger.info(f"File with id {file_id} deleted from ChromaDB")
    except Exception as e:
        # Log the error but don't fail the request if ChromaDB deletion fails
        logger.error(f"Failed to delete file from ChromaDB: {str(e)}")

    logger.info(f"File {file_id} successfully deleted")

    return {
        "message": "File deleted successfully",
        "file_id": file_id,
        "filename": file_data.get("filename", "Unknown"),
    }


async def update_file_service(
    file_id: str, user_id: str, update_data: dict, chromadb_client=None
) -> dict:
    """
    Update file metadata and optionally refresh the ChromaDB embedding.

    Args:
        file_id (str): The ID of the file to update
        user_id (str): The ID of the authenticated user
        update_data (dict): The file data to update
        chromadb_client: The ChromaDB client instance

    Returns:
        dict: Updated file metadata

    Raises:
        HTTPException: If the file is not found or update fails
    """
    logger.info(f"Updating file with id: {file_id} for user: {user_id}")

    # Get the current file data
    file_data = await files_collection.find_one(
        {"file_id": file_id, "user_id": user_id}
    )
    if not file_data:
        logger.error(f"File with id {file_id} not found for user {user_id}")
        raise HTTPException(status_code=404, detail="File not found")

    # Prepare update data
    current_time = datetime.now(timezone.utc)
    update_data["updated_at"] = current_time

    # Check if description is being updated
    description_updated = "description" in update_data

    # Update in MongoDB
    result = await files_collection.update_one(
        {"file_id": file_id, "user_id": user_id}, {"$set": update_data}
    )

    if result.modified_count == 0:
        logger.warning(f"No changes made to file {file_id}")

    # Get the updated file data
    updated_file = await files_collection.find_one(
        {"file_id": file_id, "user_id": user_id}
    )
    if not updated_file:
        logger.error(f"Updated file {file_id} not found")
        raise HTTPException(status_code=404, detail="File not found after update")

    # If description was updated and ChromaDB client is provided, update the embedding
    if description_updated and chromadb_client:
        try:
            # Generate new embedding for the updated description
            new_description = update_data["description"]
            new_embedding = generate_embedding(new_description)

            # Update embedding in MongoDB
            await files_collection.update_one(
                {"file_id": file_id, "user_id": user_id},
                {"$set": {"embedding": new_embedding}},
            )

            # Update in ChromaDB
            try:
                chroma_documents_collection = await chromadb_client.get_collection(
                    name="documents"
                )

                # Update the document in ChromaDB
                await chroma_documents_collection.update(
                    ids=[file_id],
                    embeddings=[new_embedding],
                    documents=[new_description],
                    metadatas=[
                        {
                            "file_id": file_id,
                            "user_id": user_id,
                            "filename": updated_file.get("filename", ""),
                            "type": updated_file.get("type", ""),
                            "conversation_id": updated_file.get("conversation_id", ""),
                        }
                    ],
                )
                logger.info(f"File with id {file_id} updated in ChromaDB")
            except Exception as chroma_err:
                # Log but don't fail if ChromaDB update fails
                logger.error(
                    f"Failed to update file in ChromaDB: {str(chroma_err)}",
                    exc_info=True,
                )
        except Exception as embed_err:
            logger.error(
                f"Failed to generate new embedding: {str(embed_err)}", exc_info=True
            )

    # Convert ObjectId to string for serialization
    if "_id" in updated_file:
        updated_file["_id"] = str(updated_file["_id"])

    # Convert date fields to ISO format
    for date_field in ["created_at", "updated_at"]:
        if date_field in updated_file and hasattr(
            updated_file[date_field], "isoformat"
        ):
            updated_file[date_field] = updated_file[date_field].isoformat()

    return serialize_document(updated_file)
