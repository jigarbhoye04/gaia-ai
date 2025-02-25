import hashlib
import re


def sanitize_text(text: str) -> str:
    sanitized = re.sub(r"[\x00-\x1F]+", " ", text).strip()
    return sanitized


def generate_cache_key(text: str) -> str:
    hash_digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return f"tts:{hash_digest}"
