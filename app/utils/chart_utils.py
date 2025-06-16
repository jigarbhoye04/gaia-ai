"""Chart processing utilities for code execution."""

import base64
import io
import re
import time
import uuid
from typing import Dict, List, Optional

import cloudinary.uploader

from app.config.loggers import chat_logger as logger


async def upload_chart_to_cloudinary(
    chart_bytes: bytes, chart_title: str = "chart", user_id: str | None = None
) -> str | None:
    """
    Upload a chart image to Cloudinary and return the secure URL.
    
    Args:
        chart_bytes: The chart image data as bytes
        chart_title: Title for the chart (used in filename)
        user_id: User ID for organizing uploads
        
    Returns:
        Secure URL of uploaded chart or None if upload fails
        
    Raises:
        Exception: If upload fails (logged but not re-raised)
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
        if image_url:
            logger.info(f"Chart uploaded successfully. URL: {image_url}")
            return image_url
        else:
            logger.error("Missing secure_url in Cloudinary upload response")
            return None

    except Exception as e:
        logger.error(f"Failed to upload chart to Cloudinary: {str(e)}", exc_info=True)
        return None


def process_chart_results(
    execution_results: List, user_id: str = "anonymous"
) -> tuple[List[Dict], List[str]]:
    """
    Process execution results to extract and upload charts.
    
    Args:
        execution_results: List of execution results from E2B
        user_id: User ID for chart uploads
        
    Returns:
        Tuple of (charts_list, error_messages)
    """
    charts = []
    chart_errors = []
    
    if not execution_results:
        return charts, chart_errors
    
    for i, result in enumerate(execution_results):
        # Check for static chart (PNG base64)
        if hasattr(result, 'png') and result.png:
            try:
                chart_bytes = base64.b64decode(result.png)
                chart_url = upload_chart_to_cloudinary(
                    chart_bytes,
                    f"chart_{i}",
                    user_id
                )
                if chart_url:
                    charts.append({
                        "id": f"chart_{i}",
                        "url": chart_url,
                        "text": f"Chart {i + 1}",
                        "type": "image",
                        "title": f"Generated Chart {i + 1}",
                        "description": f"Chart generated from code execution"
                    })
                    logger.info(f"Successfully processed chart {i + 1}")
                else:
                    error_msg = f"Failed to upload chart {i + 1} to Cloudinary"
                    chart_errors.append(error_msg)
                    logger.warning(error_msg)
            except Exception as e:
                error_msg = f"Failed to process chart {i + 1}: {str(e)}"
                chart_errors.append(error_msg)
                logger.error(error_msg, exc_info=True)
    
    return charts, chart_errors


def validate_chart_data(charts: List[Dict]) -> List[Dict]:
    """
    Validate and sanitize chart data.
    
    Args:
        charts: List of chart dictionaries
        
    Returns:
        List of validated chart dictionaries
    """
    validated_charts = []
    
    for chart in charts:
        if not isinstance(chart, dict):
            continue
            
        # Ensure required fields exist
        if "id" not in chart or "url" not in chart:
            continue
            
        # Sanitize and validate
        validated_chart = {
            "id": str(chart.get("id", "")).strip(),
            "url": str(chart.get("url", "")).strip(),
            "text": str(chart.get("text", "Chart")).strip(),
            "type": str(chart.get("type", "image")).strip(),
            "title": str(chart.get("title", "Generated Chart")).strip(),
            "description": str(chart.get("description", "")).strip()
        }
        
        # Validate URL format
        if not validated_chart["url"].startswith(("http://", "https://")):
            continue
            
        validated_charts.append(validated_chart)
    
    return validated_charts