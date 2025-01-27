import os
import logging
from typing import Optional


def get_logger(
    name: Optional[str] = None, log_file: str = "app.log", log_dir: str = "logs"
) -> logging.Logger:
    """Create a simple, configurable logger."""
    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger(name or __name__)
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    file_handler = logging.FileHandler(os.path.join(log_dir, log_file))
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    )

    logger.addHandler(file_handler)
    return logger


# Default logger
logger = get_logger()
