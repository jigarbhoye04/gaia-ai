import os
import logging
from typing import Dict, Optional
from rich.logging import RichHandler


# Global dictionary to store logger instances
_loggers: Dict[str, logging.Logger] = {}


def get_logger(
    name: Optional[str] = None,
    log_file: str = "app.log",
    log_dir: str = "logs",
    log_level: int = logging.INFO,
    show_time: bool = True,
    show_level: bool = True,
    show_path: bool = False,
    rich_tracebacks: bool = True,
    tracebacks_extra_lines: int = 3,
    tracebacks_suppress: tuple = (),
    use_file_logging: bool = False,
) -> logging.Logger:
    """Create a configurable logger with Rich logging for colored console output.

    Implements a singleton pattern to ensure only one logger exists per name.
    """
    global _loggers

    # Use the provided name or default to module name
    logger_name = name or __name__

    # Return existing logger if already created
    if logger_name in _loggers:
        return _loggers[logger_name]

    # Get or create the logger
    logger = logging.getLogger(logger_name)

    # Only configure the logger if it hasn't been configured yet
    if not logger.handlers:
        logger.setLevel(log_level)
        logger.propagate = False  # Prevent propagation to avoid duplicate logs

        # File handler (plain text logging) - only if use_file_logging is True
        if use_file_logging:
            try:
                # Create log directory if it doesn't exist - only when needed
                os.makedirs(log_dir, exist_ok=True)

                formatter = logging.Formatter(
                    "%(asctime)s - %(levelname)s - %(message)s"
                )
                file_handler = logging.FileHandler(os.path.join(log_dir, log_file))
                file_handler.setFormatter(formatter)
                logger.addHandler(file_handler)
            except PermissionError:
                # Log to console if we can't create the log directory
                print(
                    f"Warning: Cannot create or write to log directory '{log_dir}'. File logging disabled."
                )

        # Rich console handler (colored output)
        console_handler = RichHandler(
            show_time=show_time,
            show_level=show_level,
            show_path=show_path,
            rich_tracebacks=rich_tracebacks,
            tracebacks_extra_lines=tracebacks_extra_lines,
            tracebacks_suppress=tracebacks_suppress,
        )
        logger.addHandler(console_handler)

    # Store the logger in our dictionary
    _loggers[logger_name] = logger

    return logger


# Default application logger - using file logging by default for local development
logger = get_logger(
    name="app", log_file="app.log", show_path=True, use_file_logging=True
)
