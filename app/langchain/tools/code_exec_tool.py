"""Riza AI code execution tool for secure sandbox execution."""

from typing import Annotated, Literal
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from rizaio import Riza

from app.config.loggers import chat_logger as logger
from app.config.settings import settings
from app.docstrings.langchain.tools.code_exec_docs import (
    CODE_EXECUTION_TOOL,
)
from app.docstrings.utils import with_doc


# Initialize Riza client
riza_client = (
    Riza(api_key=settings.RIZA_API_KEY) if hasattr(settings, "RIZA_API_KEY") else None
)


@tool
@with_doc(CODE_EXECUTION_TOOL)
async def execute_code(
    language: Annotated[
        Literal["python", "javascript", "typescript", "ruby", "php"],
        "Programming language to use for code execution",
    ],
    code: Annotated[str, "The code to execute in the secure sandbox environment"],
) -> str:
    """Execute code safely in an isolated Riza AI sandbox."""

    if not riza_client:
        return "Error: Riza API key not configured. Please set RIZA_API_KEY in environment variables."

    try:
        writer = get_stream_writer()
        writer({"progress": f"Executing {language} code in secure sandbox..."})

        result = riza_client.command.exec(language=language.lower(), code=code)

        # Format output
        output = []
        if result.stdout:
            output.append(f"Output:\n{result.stdout}")
        if result.stderr:
            output.append(f"Errors:\n{result.stderr}")
        output.append(f"Exit Code: {result.exit_code}")

        logger.info(f"Code execution completed with exit code: {result.exit_code}")
        return "\n\n".join(output)

    except Exception as e:
        error_msg = f"Error executing code: {str(e)}"
        logger.error(error_msg)
        return error_msg
