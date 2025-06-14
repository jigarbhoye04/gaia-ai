"""E2B code execution tool with chart detection and streaming support."""

import io
import json
import re
import time
import uuid
from typing import Annotated, Dict, Literal, Optional, Any

import cloudinary.uploader
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from e2b_code_interpreter import Sandbox

from app.config.loggers import chat_logger as logger
from app.config.settings import settings
from app.docstrings.langchain.tools.code_exec_docs import CODE_EXECUTION_TOOL
from app.docstrings.utils import with_doc


async def upload_chart_to_cloudinary(
    chart_bytes: bytes, 
    chart_title: str = "chart",
    user_id: str = None
) -> str | None:
    """
    Upload a chart image to Cloudinary and return the secure URL.
    
    Args:
        chart_bytes: The raw bytes of the chart image
        chart_title: Title or description of the chart (for naming)
        user_id: Optional user ID for organization
        
    Returns:
        str: The secure URL of the uploaded image
    """
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
        if not image_url:
            logger.error("Missing secure_url in Cloudinary upload response")
            return None
            
        logger.info(f"Chart uploaded successfully. URL: {image_url}")
        return image_url
        
    except Exception as e:
        logger.error(f"Failed to upload chart to Cloudinary: {str(e)}", exc_info=True)
        return None


def extract_chart_metadata(execution_result) -> Optional[Dict[str, Any]]:
    """Extract chart metadata from E2B execution results."""
    if not execution_result.results:
        return None
    
    charts = []
    for result in execution_result.results:
        # Check if result contains chart data
        if hasattr(result, 'formats') and result.formats:
            chart_data = {
                "type": "chart",
                "formats": {}
            }
            
            # Extract different format outputs (PNG, SVG, etc.)
            for format_type, format_data in result.formats.items():
                if format_type in ['png', 'svg', 'jpeg']:
                    chart_data["formats"][format_type] = format_data
            
            # Extract chart metadata if available
            if hasattr(result, 'text') and result.text:
                try:
                    # Try to parse any JSON metadata from text output
                    metadata = json.loads(result.text)
                    chart_data["metadata"] = metadata
                except (json.JSONDecodeError, TypeError):
                    chart_data["text"] = result.text
            
            charts.append(chart_data)
    
    return {"charts": charts} if charts else None


async def format_chart_for_frontend(chart_data: Dict[str, Any], user_id: str = None) -> Dict[str, Any]:
    """Format chart data for frontend consumption with Cloudinary uploads."""
    formatted_charts = []
    
    for chart in chart_data.get("charts", []):
        formatted_chart = {
            "id": f"chart_{len(formatted_charts)}",
            "type": chart.get("type", "chart"),
            "images": {},
            "metadata": chart.get("metadata", {}),
            "text": chart.get("text", "")
        }
        
        # Upload chart images to Cloudinary
        for format_type, format_data in chart.get("formats", {}).items():
            try:
                if isinstance(format_data, bytes):
                    # Upload bytes to Cloudinary
                    chart_title = chart.get("text", f"chart_{formatted_chart['id']}")
                    image_url = await upload_chart_to_cloudinary(
                        format_data, 
                        chart_title, 
                        user_id or "anonymous"
                    )
                    if image_url:
                        formatted_chart["images"][format_type] = image_url
                elif isinstance(format_data, str):
                    # If it's already a string (URL), use it directly
                    formatted_chart["images"][format_type] = format_data
            except Exception as e:
                logger.error(f"Failed to process chart format {format_type}: {e}")
                continue
        
        # Only add charts that have at least one successfully uploaded image
        if formatted_chart["images"]:
            formatted_charts.append(formatted_chart)
    
    return {"charts": formatted_charts}


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
                "status": "executing"
            }
        }
        writer(code_data)

        # Create sandbox and execute code
        async with Sandbox() as sbx:
            # For JavaScript/TypeScript, we might need to install packages
            if language in ["javascript", "typescript"]:
                # Check if code contains imports that need installation
                if "import" in code or "require(" in code:
                    writer({"progress": "Installing required packages..."})
                    # Common packages that might be needed
                    try:
                        await sbx.commands.run("npm install axios plotly.js d3 lodash")
                    except Exception as e:
                        logger.warning(f"Package installation warning: {e}")

            # Execute the code
            execution = await sbx.run_code(code, language=language)
            
            # Extract chart data if present
            chart_data = extract_chart_metadata(execution)
            formatted_charts = await format_chart_for_frontend(chart_data) if chart_data else None

            # Update code data with results
            code_data["code_data"]["output"] = {
                "stdout": "\n".join(execution.logs.stdout) if execution.logs.stdout else "",
                "stderr": "\n".join(execution.logs.stderr) if execution.logs.stderr else "",
                "results": [str(result) for result in execution.results] if execution.results else [],
                "error": str(execution.error) if execution.error else None
            }
            code_data["code_data"]["charts"] = formatted_charts
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

            if chart_data:
                chart_count = len(chart_data.get("charts", []))
                output_parts.append(f"Generated {chart_count} chart(s)")

            logger.info(f"Code execution completed successfully. Charts: {bool(chart_data)}")
            return "\n\n".join(output_parts) if output_parts else "Code executed successfully (no output)"

    except Exception as e:
        error_msg = f"Error executing code: {str(e)}"
        logger.error(error_msg)
        
        # Send error state to frontend
        try:
            writer = get_stream_writer()
            writer({
                "code_data": {
                    "language": language,
                    "code": code,
                    "output": {
                        "stdout": "",
                        "stderr": str(e),
                        "results": [],
                        "error": str(e)
                    },
                    "charts": None,
                    "status": "error"
                }
            })
        except Exception:
            pass  # Ignore streaming errors during error handling
        
        return error_msg