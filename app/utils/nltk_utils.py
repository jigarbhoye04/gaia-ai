import nltk
from nltk.data import find


def download_nltk_resources():
    """
    Ensure necessary NLTK resources are downloaded.
    This function checks for required resources and downloads them if missing.
    """
    resources = [
        ("tokenizers/punkt", "punkt"),
        ("corpora/stopwords", "stopwords"),
        ("tokenizers/punkt_tab", "punkt_tab"),
    ]

    for resource_path, resource_name in resources:
        try:
            find(resource_path)
            print(f"{resource_name.capitalize()} resource already available.")
        except LookupError:
            print(f"{resource_name.capitalize()} resource not found. Downloading...")
            nltk.download(resource_name)
