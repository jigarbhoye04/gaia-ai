from typing import Annotated

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
) -> str:
    # Write doc string to explain the function to llm. tool is used to fetch whole file
    """
    Fetch the content of a file using its ID.
    This tool retrieves the content of a file based on its unique identifier.
    It is used to access files stored in the system, such as documents or images.
    Args:
        file_id (str): The ID of the file to fetch.
    Returns:
        str: The content of the file.
    """
    try:
        configurable = config.get("configurable")

        if not configurable:
            logger.error("Configurable is not set in the config.")
            raise ValueError("Configurable is not set in the config.")

        document = await files_collection.find_one(
            filter={"_id": file_id, "user_id": configurable["user_id"]},
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
    config: RunnableConfig,
) -> str:
    # Write doc string to explain the function to llm. tool is used to fetch whole file
    """
    Query a file using its ID and a specific question.
    This tool retrieves the content of a file based on its unique identifier
    and allows the user to ask questions about the file's content.
    Args:
        file_id (str): The ID of the file to query.
        query (str): The question to ask about the file.
    Returns:
        str: The answer to the query based on the file's content.
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
            user_id=configurable["user_id"],
        )

        document_ids = list(
            set([document["file_id"] for document in similar_documents])
        )

        documents = await files_collection.find(
            filter={
                "_id": {"$in": document_ids},
                "user_id": configurable["user_id"],
            },
        ).to_list(length=None)

        return _construct_content(
            documents=documents,
            similar_documents=similar_documents,
        )

    except Exception as e:
        logger.error(f"Error in querying document: {str(e)}")
        raise e


async def _get_similar_documents(
    query: str, conversation_id: str, user_id: str
) -> list:
    chroma_documents_collection = await ChromaClient.get_langchain_client(
        collection_name="documents"
    )

    if not chroma_documents_collection:
        logger.error("ChromaDB client is not available.")
        return []

    return await chroma_documents_collection.asimilarity_search(
        query=query,
        where={
            "conversation_id": conversation_id,
            "user_id": user_id,
        },
        limit=5,
    )


def _construct_content(documents: list, similar_documents: list) -> str:
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

    return content
