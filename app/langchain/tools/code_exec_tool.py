"""E2B code execution tool with chart detection and streaming support."""

import base64
import io
import re
import time
import uuid
from typing import Annotated, Literal

import cloudinary.uploader
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from e2b_code_interpreter import Sandbox

from app.config.loggers import chat_logger as logger
from app.config.settings import settings
from app.docstrings.langchain.tools.code_exec_docs import CODE_EXECUTION_TOOL
from app.docstrings.utils import with_doc


async def upload_chart_to_cloudinary(
    chart_bytes: bytes, chart_title: str = "chart", user_id: str | None = None
) -> str | None:
    """Upload a chart image to Cloudinary and return the secure URL."""
    try:
        chart_id = str(uuid.uuid4())
        timestamp = int(time.time())

        # Create a clean slug from chart title
        clean_title = re.sub(r"[^a-zA-Z0-9\s]", "", chart_title)
        slug = re.sub(r"\s+", "_", clean_title.lower())[:30]

        # Create public_id with proper organization
        if user_id:
            public_id = f"charts/{user_id}/{timestamp}_{slug}_{chart_id}"
        else:
            public_id = f"charts/{timestamp}_{slug}_{chart_id}"

        upload_result = cloudinary.uploader.upload(
            io.BytesIO(chart_bytes),
            resource_type="image",
            public_id=public_id,
            overwrite=True,
        )

        image_url = upload_result.get("secure_url")
        if image_url:
            logger.info(f"Chart uploaded successfully. URL: {image_url}")
            return image_url
        else:
            logger.error("Missing secure_url in Cloudinary upload response")
            return None

    except Exception as e:
        logger.error(f"Failed to upload chart to Cloudinary: {str(e)}", exc_info=True)
        return None


@tool
@with_doc(CODE_EXECUTION_TOOL)
async def execute_code(
    language: Annotated[
        Literal["python", "javascript", "typescript", "r", "java", "bash"],
        "Programming language to use for code execution",
    ],
    code: Annotated[str, "The code to execute in the secure sandbox environment"],
) -> str:
    """Execute code safely in an isolated E2B sandbox with chart detection."""

    if not hasattr(settings, "E2B_API_KEY") or not settings.E2B_API_KEY:
        return "Error: E2B API key not configured. Please set E2B_API_KEY in environment variables."

    writer = None
    try:
        writer = get_stream_writer()
        writer({"progress": f"Executing {language} code in secure E2B sandbox..."})

        # Send initial code data to frontend
        code_data = {
            "code_data": {
                "language": language,
                "code": code,
                "output": None,
                "charts": None,
                "status": "executing",
            }
        }
        writer(code_data)

        # Create and execute in sandbox
        sbx = Sandbox()
        try:
            # Execute the code
            execution = sbx.run_code(code, language=language)
            
            # Process charts if any were generated
            charts = []
            if execution.results:
                for i, result in enumerate(execution.results):
                    # Check for static chart (PNG base64)
                    if hasattr(result, 'png') and result.png:
                        try:
                            chart_bytes = base64.b64decode(result.png)
                            chart_url = await upload_chart_to_cloudinary(
                                chart_bytes,
                                f"chart_{i}",
                                "anonymous"
                            )
                            if chart_url:
                                charts.append({
                                    "id": f"chart_{i}",
                                    "url": chart_url,
                                    "text": f"Chart {i + 1}"
                                })
                        except Exception:
                            pass  # Skip failed charts

            # Update code data with results
            code_data["code_data"]["output"] = {
                "stdout": "\n".join(execution.logs.stdout)
                if execution.logs.stdout
                else "",
                "stderr": "\n".join(execution.logs.stderr)
                if execution.logs.stderr
                else "",
                "results": [str(result) for result in execution.results]
                if execution.results
                else [],
                "error": str(execution.error) if execution.error else None,
            }

            if charts:
                code_data["code_data"]["charts"] = charts

            code_data["code_data"]["status"] = "completed"
            writer(code_data)

            # Format output for return
            output_parts = []

            if execution.logs.stdout:
                output_parts.append(f"Output:\n{chr(10).join(execution.logs.stdout)}")

            if execution.results:
                results_text = "\n".join(str(result) for result in execution.results)
                output_parts.append(f"Results:\n{results_text}")

            if execution.logs.stderr:
                output_parts.append(f"Errors:\n{chr(10).join(execution.logs.stderr)}")

            if execution.error:
                output_parts.append(f"Execution Error: {execution.error}")

            if charts:
                output_parts.append(f"Generated {len(charts)} chart(s)")
            return (
                "\n\n".join(output_parts)
                if output_parts
                else "Code executed successfully (no output)"
            )

        finally:
            # E2B sandbox cleanup is automatic
            pass

    except Exception as e:
        error_msg = f"Error executing code: {str(e)}"
        logger.error(error_msg)

        # Send error state to frontend
        if writer:
            try:
                writer(
                    {
                        "code_data": {
                            "language": language,
                            "code": code,
                            "output": {
                                "stdout": "",
                                "stderr": str(e),
                                "results": [],
                                "error": str(e),
                            },
                            "charts": None,
                            "status": "error",
                        }
                    }
                )
            except Exception:
                pass  # Ignore streaming errors during error handling

        return error_msg
