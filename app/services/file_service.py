"""
Service module for file upload functionality with vector search capabilities.
"""

import io
from typing import Any, Dict
import uuid
from datetime import datetime, timezone

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

from app.config.loggers import app_logger as logger
from app.db.collections import files_collection
from app.utils.file_utils import generate_file_description
from app.utils.embedding_utils import generate_embedding


async def upload_file_service(
    file: UploadFile, user_id: str, conversation_id: str = None
) -> dict:
    """
    Upload a file to Cloudinary, generate embeddings if it's an image, and store metadata in MongoDB.

    Args:
        file (UploadFile): The file to upload
        user_id (str): The ID of the user uploading the file
        conversation_id (str, optional): The conversation ID to associate with the file for vector search

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
        logger.info(f"Generated description for file {file_id}: {file_description}")

        current_time = datetime.now(timezone.utc)
        file_metadata = {
            "file_id": file_id,
            "filename": file.filename,
            "content_type": file.content_type,
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

        if not file.content_type.startswith("image/"):
            try:
                embedding = generate_embedding(file_description)
                file_metadata["embedding"] = embedding
                logger.info(f"Generated embedding for image file {file_id}")
            except Exception as embed_err:
                logger.error(
                    f"Failed to generate embedding: {str(embed_err)}", exc_info=True
                )

        result = await files_collection.insert_one(file_metadata)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to store file metadata")

        logger.info(f"File uploaded successfully. ID: {file_id}, URL: {file_url}")

        return {
            "fileId": file_id,
            "url": file_url,
            "filename": file.filename,
            "description": file_description,
            "has_embedding": "embedding" in file_metadata,
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
    2. Performs vector similarity search to find relevant files based on the query
    3. Formats and adds the file information to the message context

    Args:
        context (Dict[str, Any]): The pipeline context containing request data

    Returns:
        Dict[str, Any]: Updated context with file data added
    """
    user_id = context.get("user_id")
    conversation_id = context.get("conversation_id")
    query_text = context.get("query_text", "")
    last_message = context.get("last_message")

    if not last_message:
        context["files_added"] = False
        return context

    try:
        # Track files to include in the response
        included_files = []

        # 1. First, handle explicit file IDs provided in the request
        explicit_file_ids = context.get("fileIds", [])
        if explicit_file_ids:
            logger.info(f"Fetching {len(explicit_file_ids)} files by ID")

            for file_id in explicit_file_ids:
                file_data = await files_collection.find_one({"file_id": file_id})
                if file_data:
                    # Convert ObjectId to string for serialization
                    if "_id" in file_data:
                        file_data["_id"] = str(file_data["_id"])

                    # Convert date fields to ISO format
                    for date_field in ["created_at", "updated_at"]:
                        if date_field in file_data and hasattr(
                            file_data[date_field], "isoformat"
                        ):
                            file_data[date_field] = file_data[date_field].isoformat()

                    included_files.append(file_data)

        # 2. Perform vector search for relevant files based on the query
        # Only perform the search if there's a meaningful query
        if len(query_text) > 3:
            from app.utils.embedding_utils import query_files

            # Only import locally to avoid circular imports
            relevant_files = await query_files(
                query_text=query_text,
                user_id=user_id,
                conversation_id=conversation_id,
                top_k=3,
            )

            if relevant_files:
                logger.info(f"Found {len(relevant_files)} semantically relevant files")

                # Add relevant files that weren't already included via explicit IDs
                for file in relevant_files:
                    if file.get("file_id") not in [
                        f.get("file_id") for f in included_files
                    ]:
                        # Get complete file data from database
                        complete_file = await files_collection.find_one(
                            {"file_id": file["file_id"]}
                        )
                        if complete_file:
                            # Convert ObjectId to string
                            if "_id" in complete_file:
                                complete_file["_id"] = str(complete_file["_id"])

                            # Convert date fields to ISO format
                            for date_field in ["created_at", "updated_at"]:
                                if date_field in complete_file and hasattr(
                                    complete_file[date_field], "isoformat"
                                ):
                                    complete_file[date_field] = complete_file[
                                        date_field
                                    ].isoformat()

                            # Include the similarity score from the search
                            complete_file["relevance_score"] = file.get("score", 0)
                            included_files.append(complete_file)

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
