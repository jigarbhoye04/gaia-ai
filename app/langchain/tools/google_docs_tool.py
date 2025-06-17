from typing import Annotated, Dict, Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langgraph.config import get_stream_writer

from app.config.loggers import chat_logger as logger
from app.docstrings.langchain.tools.google_docs_tool_docs import (
    CREATE_GOOGLE_DOC,
    LIST_GOOGLE_DOCS,
    GET_GOOGLE_DOC,
    UPDATE_GOOGLE_DOC,
    FORMAT_GOOGLE_DOC,
    SHARE_GOOGLE_DOC,
    SEARCH_GOOGLE_DOCS,
)
from app.docstrings.utils import with_doc

# Templates not currently used in streaming, but available for future use
# from app.langchain.templates.google_docs_templates import (
#     GOOGLE_DOCS_CREATE_TEMPLATE,
#     GOOGLE_DOCS_LIST_TEMPLATE,
#     GOOGLE_DOCS_GET_TEMPLATE,
#     GOOGLE_DOCS_UPDATE_TEMPLATE,
#     GOOGLE_DOCS_FORMAT_TEMPLATE,
#     GOOGLE_DOCS_SHARE_TEMPLATE,
#     GOOGLE_DOCS_SEARCH_TEMPLATE,
# )
from app.services.google_docs_service import (
    create_google_doc,
    list_google_docs,
    get_google_doc,
    update_google_doc_content,
    format_google_doc,
    share_google_doc,
    search_google_docs,
)


def get_auth_from_config(config: RunnableConfig) -> Dict[str, str]:
    """Extract access and refresh tokens from the config."""
    if not config:
        logger.error("Google Docs tool called without config")
        return {"access_token": "", "refresh_token": ""}

    configurable = config.get("configurable", {})
    return {
        "access_token": configurable.get("access_token", ""),
        "refresh_token": configurable.get("refresh_token", ""),
    }


@tool
@with_doc(CREATE_GOOGLE_DOC)
async def create_google_doc_tool(
    config: RunnableConfig,
    title: Annotated[str, "Title of the new Google Doc"],
    content: Annotated[Optional[str], "Initial content for the document"] = None,
) -> str:
    """Create a new Google Doc with the specified title and optional initial content."""
    try:
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return "Authentication credentials not provided"

        result = await create_google_doc(
            refresh_token=auth["refresh_token"],
            access_token=auth["access_token"],
            title=title,
            content=content,
        )

        # Send data to frontend
        writer = get_stream_writer()
        writer(
            {
                "google_docs_data": {
                    "title": result["title"],
                    "url": result["url"],
                    "action": "create",
                }
            }
        )

        logger.info(f"Created Google Doc: {result['document_id']}")

        return f"Successfully created Google Doc '{title}' with ID: {result['document_id']}. You can access it at: {result['url']}"

    except Exception as e:
        logger.error(f"Error creating Google Doc: {e}")
        return f"Error creating Google Doc: {str(e)}"


@tool
@with_doc(LIST_GOOGLE_DOCS)
async def list_google_docs_tool(
    config: RunnableConfig,
    limit: Annotated[int, "Maximum number of documents to return"] = 10,
    query: Annotated[Optional[str], "Search query to filter documents"] = None,
) -> str:
    """List the user's Google Docs with optional filtering."""
    try:
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return "Authentication credentials not provided"

        docs = await list_google_docs(
            refresh_token=auth["refresh_token"],
            access_token=auth["access_token"],
            limit=limit,
            query=query,
        )

        # Send data to frontend - show first document if any
        writer = get_stream_writer()
        if docs:
            writer(
                {
                    "google_docs_data": {
                        "title": docs[0]["title"],
                        "url": docs[0]["url"],
                        "action": "list",
                    }
                }
            )

        logger.info(f"Listed {len(docs)} Google Docs")

        if not docs:
            query_text = f' matching "{query}"' if query else ""
            return f"No Google Docs found{query_text}."

        query_text = f' matching "{query}"' if query else ""
        return f"Found {len(docs)} Google Doc{'s' if len(docs) != 1 else ''}{query_text}. Check the frontend for the list."

    except Exception as e:
        logger.error(f"Error listing Google Docs: {e}")
        return f"Error listing Google Docs: {str(e)}"


@tool
@with_doc(GET_GOOGLE_DOC)
async def get_google_doc_tool(
    document_id: Annotated[str, "ID of the document to retrieve"],
    config: RunnableConfig,
) -> str:
    """Retrieve the content and metadata of a specific Google Doc."""
    try:
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return "Authentication credentials not provided"

        doc = await get_google_doc(
            refresh_token=auth["refresh_token"],
            access_token=auth["access_token"],
            document_id=document_id,
        )

        # Send data to frontend
        writer = get_stream_writer()
        writer(
            {
                "google_docs_data": {
                    "title": doc["title"],
                    "url": doc["url"],
                    "action": "get",
                }
            }
        )

        logger.info(f"Retrieved Google Doc: {document_id}")

        return f"**{doc['title']}** (ID: {document_id})\n\nContent:\n{doc['content']}\n\nEdit at: {doc['url']}"

    except Exception as e:
        logger.error(f"Error retrieving Google Doc {document_id}: {e}")
        return f"Error retrieving Google Doc: {str(e)}"


@tool
@with_doc(UPDATE_GOOGLE_DOC)
async def update_google_doc_tool(
    config: RunnableConfig,
    document_id: Annotated[str, "ID of the document to update"],
    content: Annotated[str, "Content to add or replace"],
    insert_at_end: Annotated[
        bool, "Whether to append at end or replace all content"
    ] = True,
) -> str:
    """Update the content of an existing Google Doc."""
    try:
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return "Authentication credentials not provided"

        result = await update_google_doc_content(
            refresh_token=auth["refresh_token"],
            access_token=auth["access_token"],
            document_id=document_id,
            content=content,
            insert_at_end=insert_at_end,
        )

        # Send data to frontend
        writer = get_stream_writer()
        # Get document title for display
        doc_title = f"Document {document_id[:8]}..."  # Fallback title
        doc_info = await get_google_doc(
            auth["refresh_token"], auth["access_token"], document_id
        )
        doc_title = doc_info["title"]

        writer(
            {
                "google_docs_data": {
                    "title": doc_title,
                    "url": result["url"],
                    "action": "update",
                }
            }
        )

        logger.info(f"Updated Google Doc: {document_id}")

        action = "appended to" if insert_at_end else "replaced in"
        return f"Successfully {action} the document. You can view the changes at: {result['url']}"

    except Exception as e:
        logger.error(f"Error updating Google Doc {document_id}: {e}")
        return f"Error updating Google Doc: {str(e)}"


@tool
@with_doc(FORMAT_GOOGLE_DOC)
async def format_google_doc_tool(
    document_id: Annotated[str, "ID of the document to format"],
    start_index: Annotated[int, "Start position for formatting"],
    end_index: Annotated[int, "End position for formatting"],
    config: RunnableConfig,
    bold: Annotated[Optional[bool], "Apply bold formatting"] = None,
    italic: Annotated[Optional[bool], "Apply italic formatting"] = None,
    underline: Annotated[Optional[bool], "Apply underline formatting"] = None,
    font_size: Annotated[Optional[int], "Font size in points"] = None,
    foreground_color: Annotated[
        Optional[Dict[str, float]], "Text color as RGB values (0-1)"
    ] = None,
) -> str:
    """Apply formatting to a specific range of text in a Google Doc."""
    try:
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return "Authentication credentials not provided"

        formatting = {}
        if bold is not None:
            formatting["bold"] = bold
        if italic is not None:
            formatting["italic"] = italic
        if underline is not None:
            formatting["underline"] = underline
        if font_size is not None:
            formatting["fontSize"] = font_size
        if foreground_color is not None:
            formatting["foregroundColor"] = foreground_color

        result = await format_google_doc(
            refresh_token=auth["refresh_token"],
            access_token=auth["access_token"],
            document_id=document_id,
            start_index=start_index,
            end_index=end_index,
            formatting=formatting,
        )

        # Send data to frontend
        writer = get_stream_writer()
        # Get document title for display
        doc_title = f"Document {document_id[:8]}..."  # Fallback title
        doc_info = await get_google_doc(
            auth["refresh_token"], auth["access_token"], document_id
        )
        doc_title = doc_info["title"]

        writer(
            {
                "google_docs_data": {
                    "title": doc_title,
                    "url": result["url"],
                    "action": "format",
                }
            }
        )

        logger.info(f"Applied formatting to Google Doc: {document_id}")

        format_description = []
        if bold:
            format_description.append("bold")
        if italic:
            format_description.append("italic")
        if underline:
            format_description.append("underline")
        if font_size:
            format_description.append(f"font size {font_size}pt")

        return f"Successfully applied {', '.join(format_description) if format_description else 'formatting'} to characters {start_index}-{end_index}. View changes at: {result['url']}"

    except Exception as e:
        logger.error(f"Error formatting Google Doc {document_id}: {e}")
        return f"Error formatting Google Doc: {str(e)}"


@tool
@with_doc(SHARE_GOOGLE_DOC)
async def share_google_doc_tool(
    document_id: Annotated[str, "ID of the document to share"],
    email: Annotated[str, "Email address to share with"],
    config: RunnableConfig,
    role: Annotated[str, "Permission level (reader, writer, owner)"] = "writer",
    send_notification: Annotated[bool, "Whether to send email notification"] = True,
) -> str:
    """Share a Google Doc with another user."""
    try:
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return "Authentication credentials not provided"

        result = await share_google_doc(
            refresh_token=auth["refresh_token"],
            access_token=auth["access_token"],
            document_id=document_id,
            email=email,
            role=role,
            send_notification=send_notification,
        )

        # Send data to frontend
        writer = get_stream_writer()
        # Get document title for display
        doc_title = f"Document {document_id[:8]}..."  # Fallback title
        doc_info = await get_google_doc(
            auth["refresh_token"], auth["access_token"], document_id
        )
        doc_title = doc_info["title"]

        writer(
            {
                "google_docs_data": {
                    "title": doc_title,
                    "url": result["url"],
                    "action": "share",
                }
            }
        )

        logger.info(f"Shared Google Doc {document_id} with {email}")

        return f"Successfully shared the document with {email} as {role}. {'Email notification sent.' if send_notification else 'No email notification sent.'} Document URL: {result['url']}"

    except Exception as e:
        logger.error(f"Error sharing Google Doc {document_id}: {e}")
        return f"Error sharing Google Doc: {str(e)}"


@tool
@with_doc(SEARCH_GOOGLE_DOCS)
async def search_google_docs_tool(
    query: Annotated[str, "Search terms to look for"],
    config: RunnableConfig,
    limit: Annotated[int, "Maximum number of results"] = 10,
) -> str:
    """Search through the user's Google Docs by title and content."""
    try:
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return "Authentication credentials not provided"

        docs = await search_google_docs(
            refresh_token=auth["refresh_token"],
            access_token=auth["access_token"],
            query=query,
            limit=limit,
        )

        # Send data to frontend - show first document if any
        writer = get_stream_writer()
        if docs:
            writer(
                {
                    "google_docs_data": {
                        "title": docs[0]["title"],
                        "url": docs[0]["url"],
                        "action": "search",
                    }
                }
            )

        logger.info(f"Found {len(docs)} Google Docs matching query: {query}")

        if not docs:
            return f"No Google Docs found matching '{query}'."

        return f"Found {len(docs)} Google Doc{'s' if len(docs) != 1 else ''} matching '{query}'. Check the frontend for the list."

    except Exception as e:
        logger.error(f"Error searching Google Docs: {e}")
        return f"Error searching Google Docs: {str(e)}"


# Export all tools for registry
tools = [
    create_google_doc_tool,
    list_google_docs_tool,
    get_google_doc_tool,
    update_google_doc_tool,
    format_google_doc_tool,
    share_google_doc_tool,
    search_google_docs_tool,
]
