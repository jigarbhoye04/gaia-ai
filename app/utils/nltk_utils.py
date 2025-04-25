import nltk
from nltk.data import find
from app.config.loggers import app_logger as logger


def download_nltk_resources():
    """
    Ensure necessary NLTK resources are downloaded.
    This function checks for required resources and downloads them if missing.
    """
    logger.info("NLTK: Initializing NLTK for Natural Language Processing...")

    nltk.data.path.append("/home/appuser/nltk_data")

    resources = [
        ("tokenizers/punkt", "punkt"),
        ("corpora/stopwords", "stopwords"),
        ("tokenizers/punkt_tab", "punkt_tab"),
    ]

    for resource_path, resource_name in resources:
        try:
            find(resource_path)
            logger.info(
                f"NLTK: {resource_name.capitalize()} resource already available."
            )
        except LookupError:
            logger.info(
                f"NLTK: {resource_name.capitalize()} resource not found. Downloading..."
            )
            nltk.download(resource_name)
