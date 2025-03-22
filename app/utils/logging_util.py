import os
import logging
from typing import Optional
from rich.logging import RichHandler


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
) -> logging.Logger:
    """Create a configurable logger with Rich logging for colored console output."""

    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger(name or __name__)
    logger.setLevel(log_level)
    logger.handlers.clear()

    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

    # File handler (plain text logging)
    file_handler = logging.FileHandler(os.path.join(log_dir, log_file))
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

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

    return logger


logger = get_logger(name="app", log_file="app.log", show_path=True)
