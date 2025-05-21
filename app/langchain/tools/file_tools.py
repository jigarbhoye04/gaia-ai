from typing import Annotated, Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from app.config.loggers import chat_logger as logger
from app.db.chromadb import ChromaClient
from app.db.collections import files_collection


@tool
async def fetch_file(
    file_id: Annotated[
        str,
        "The ID of the file to fetch.",
    ],
    config: RunnableConfig,
):
    """
    Fetches the complete content of a file from the database using its unique file ID.

    This tool retrieves the entire document content from the database, rather than
    just searching for relevant sections. It accesses files stored in MongoDB that
    were previously uploaded by the user.

    Use this tool if:
    - You need to read or analyze an entire document
    - The user asks to see the full contents of a specific file
    - You need comprehensive context from a document for detailed analysis
    - The file's complete information is required for understanding or response

    Avoid using this tool if:
    - You only need specific information from a document (use query_file instead)
    - The user hasn't mentioned a specific file to retrieve
    - You can answer the user's question without accessing the full document

    The function handles various document storage formats (string, list, dictionary)
    and returns content in markdown format when possible.

    Examples:
    - ✅ "Show me my resume file" (retrieve the entire resume)
    - ✅ "What's in the project scope document?" (retrieve full document)
    - ❌ "What was the budget mentioned in the finance report?" (use query_file)
    - ❌ "Find information about X in my documents" (use query_file)

    Returns:
        str: The complete document content in markdown format, or an error message
             if the document is not found or has an invalid format.
    """
    try:
        configurable = config.get("configurable")

        if not configurable:
            logger.error("Configurable is not set in the config.")
            raise ValueError("Configurable is not set in the config.")

        document = await files_collection.find_one(
            filter={"fileId": file_id, "user_id": configurable["user_id"]},
        )

        if not document:
            logger.error(f"Document with ID {file_id} not found.")
            return "Document with the given ID not found."

        document_summary = ""

        if isinstance(document["description"], str):
            document_summary = document["description"]
        elif isinstance(document["description"], list):
            for page in document["description"]:
                document_summary += page["data"]["md"]
        elif isinstance(document["description"], dict):
            document_summary = document["description"].get("md", "")
        else:
            logger.error(
                f"Unexpected document description type: {type(document['description'])}"
            )
            return "Document description is not in a valid format."

        return document_summary
    except Exception as e:
        logger.error(f"Error in fetching document: {str(e)}")
        raise e


@tool
async def query_file(
    query: Annotated[
        str,
        "The query to ask about the file.",
    ],
    file_id: Annotated[
        Optional[str],
        "The ID of the file to query. If not provided, it will search all files.",
    ],
    config: RunnableConfig,
):
    """
    Queries a file or multiple files based on the provided query string and file ID.

    This tool performs a semantic search to find relevant information within documents
    based on your query. It uses vector similarity to identify the most appropriate
    sections of documents that match your question.

    Use this tool if:
    - You need specific information from one or more documents
    - You want to ask a question about the content of a file
    - You need to find relevant sections rather than reading an entire document
    - You're looking for similar information across multiple files

    Avoid using this tool if:
    - You need to see the complete content of a document (use fetch_file instead)
    - You want general information not contained in any of the user's files
    - The user hasn't provided enough context about what they're searching for

    The tool can search within a specific file (if file_id is provided) or across
    all files associated with the user's conversation.

    Examples:
    - ✅ "What's the budget for Q3 in my finance document?" (specific information)
    - ✅ "Find all mentions of project timelines in my files" (search across files)
    - ❌ "Show me my entire resume" (use fetch_file instead)
    - ❌ "Tell me about this file" (too vague, needs more specific query)

    Returns:
        str: A formatted response containing relevant sections from the documents
             that match the query, or an error message if no matches are found.
    """
    try:
        configurable = config.get("configurable")

        if not configurable:
            logger.error("Configurable is not set in the config.")
            raise ValueError("Configurable is not set in the config.")

        conversation_id = configurable["thread_id"]

        similar_documents = await _get_similar_documents(
            query=query,
            conversation_id=conversation_id,
            file_id=file_id,
            user_id=configurable["user_id"],
        )

        logger.info(f"Similar documents found: {similar_documents}")

        document_ids = list(
            set([document["file_id"] for document in similar_documents])
        )

        logger.info(f"Document IDs: {document_ids}")

        documents = await files_collection.find(
            filter={
                "fileId": {"$in": document_ids},
                "user_id": configurable["user_id"],
            },
        ).to_list(length=None)

        logger.info(f"Documents found: {documents}")

        return _construct_content(
            documents=documents,
            similar_documents=similar_documents,
        )

    except Exception as e:
        logger.error(f"Error in querying document: {str(e)}")
        raise e


async def _get_similar_documents(
    query: str,
    conversation_id: str,
    user_id: str,
    file_id: Optional[str] = None,
) -> list:
    """
    Helper function to retrieve documents similar to the query from ChromaDB.

    This function performs a semantic similarity search within ChromaDB to find documents
    that match the provided query. It uses filters to limit results to the user's documents
    and specific conversation context.

    Args:
        query: The search query string to find similar documents
        conversation_id: The ID of the current conversation to filter documents
        user_id: The ID of the user who owns the documents
        file_id: Optional file ID to limit search to a specific file

    Returns:
        list: List of similar documents with their metadata and similarity scores
    """
    chroma_documents_collection = await ChromaClient.get_langchain_client(
        collection_name="documents"
    )

    if not chroma_documents_collection:
        logger.error("ChromaDB client is not available.")
        return []

    filters = {
        "$and": [
            {"user_id": user_id},
            {"conversation_id": conversation_id},
        ]
    }

    if file_id:
        filters["$and"].append({"file_id": file_id})

    return await chroma_documents_collection.asimilarity_search_with_score(
        query=query,
        filter=filters,
        k=5,
    )


def _construct_content(documents: list, similar_documents: list) -> str:
    """
    Helper function to construct a formatted response from similar documents.

    This function takes the document metadata from MongoDB and similar document sections
    from ChromaDB to build a human-readable response. It handles different document formats
    and extracts the relevant content, organizing it by document ID and page number.

    Args:
        documents: List of document metadata from MongoDB
        similar_documents: List of similar document sections from ChromaDB with similarity scores

    Returns:
        str: Formatted content string containing relevant document sections with proper
             attribution and structure for easy reading
    """
    content = ""

    for similar_document in similar_documents:
        document_id = similar_document["file_id"]
        document = next(
            (doc for doc in documents if str(doc["_id"]) == str(document_id)),
            None,
        )

        if not document:
            logger.error(f"Document with ID {document_id} not found.")
            continue

        if isinstance(document["description"], str):
            content += f"Document ID: {document_id}\n"
            content += f"Description: {document['description']}\n\n"
        elif isinstance(document["description"], list):
            target_page_number = similar_document["page_number"]
            for page in document["description"]:
                if page["data"]["page_number"] == target_page_number:
                    content += f"Document ID: {document_id}\n"
                    content += f"Page Number: {target_page_number}\n"
                    content += f"Description: {page['data']['md']}\n\n"
                    break
        elif isinstance(document["description"], dict):
            content += f"Document ID: {document_id}\n"
            content += f"Description: {document['description'].get('md', '')}\n\n"
        else:
            logger.error(
                f"Unexpected document description type: {type(document['description'])}"
            )
            content += f"Document ID: {document_id}\n"
            content += "Description: Invalid format\n\n"

    logger.info(f"Constructed content: {content}")

    return content
