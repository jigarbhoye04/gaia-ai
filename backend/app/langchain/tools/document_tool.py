import os
from typing import Annotated, Any, Dict, Optional
from uuid import uuid4

import pypandoc
from langchain_core.runnables.config import RunnableConfig
from langchain_core.tools import tool
from langgraph.config import get_stream_writer

from app.config.loggers import chat_logger as logger
from app.docstrings.langchain.tools.document_tool_docs import GENERATE_DOCUMENT
from app.docstrings.utils import with_doc
from app.middleware.langchain_rate_limiter import with_rate_limiting
from app.services.upload_service import upload_file_to_cloudinary


@tool
@with_rate_limiting("document_generation")
@with_doc(GENERATE_DOCUMENT)
def generate_document(
    config: RunnableConfig,
    content: Annotated[
        str,
        "Complete file content - write EXACTLY what should appear in the final file",
    ],
    filename: Annotated[
        str, "Filename WITHOUT extension (e.g., 'script' not 'script.py')"
    ],
    format: Annotated[
        str, "File extension ONLY (e.g., 'py', 'js', 'html', 'pdf', 'docx', 'txt')"
    ],
    is_plain_text: Annotated[
        bool,
        "ALWAYS True for: code files (py,js,html,css,json,xml,sql,etc), text files, data files, config files. ONLY False for: pdf,docx,odt,epub - documents requiring special formatting",
    ],
    title: Annotated[
        Optional[str], "Document title - ONLY used when is_plain_text=False"
    ] = None,
    metadata: Annotated[
        Optional[Dict[str, Any]],
        "Additional metadata - ONLY used when is_plain_text=False",
    ] = None,
) -> str:
    output_filename = f"{filename}.{format}"
    temp_path = f"/tmp/{output_filename}"

    try:
        if is_plain_text:
            # Direct write - no processing, no limitations
            with open(temp_path, "w", encoding="utf-8") as f:
                f.write(content)
        else:
            # Process through pypandoc for formatted documents
            extra_args = []

            if title:
                extra_args.extend(["-M", f"title={title}"])

            if metadata:
                for key, value in metadata.items():
                    extra_args.extend(["-M", f"{key}={value}"])

            if format == "pdf":
                extra_args.extend(["--pdf-engine=xelatex"])

            pypandoc.convert_text(
                source=content,
                to=format,
                format="md",
                outputfile=temp_path,
                extra_args=extra_args,
            )

        cloudinary_url = upload_file_to_cloudinary(
            file_path=temp_path, public_id=f"{uuid4()}_{output_filename}"
        )

        # Return the successfully processed events
        writer = get_stream_writer()

        # Send calendar options to frontend via writer
        writer(
            {
                "document_data": {
                    "filename": output_filename,
                    "url": cloudinary_url,
                    "is_plain_text": is_plain_text,
                    "title": title,
                    "metadata": metadata,
                },
                "intent": "document",
            }
        )

        logger.info("Document generated and uploaded successfully")
        logger.info(f"Document URL: {cloudinary_url}")

        return f"Generated {output_filename}. It will be available at to users on the frontend. Do not say anything related to the generated document in the response. It's visible to users on the frontend."

    except Exception as e:
        logger.error(f"Error generating document: {str(e)}")
        raise Exception(f"Generation failed: {str(e)}")
    finally:
        # Clean up temporary file if it exists
        if os.path.exists(temp_path):
            os.remove(temp_path)
