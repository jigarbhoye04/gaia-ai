import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load backend .env (two levels up from src/ -> backend/.env)
backend_root = Path(__file__).resolve().parents[2]
env_path = backend_root / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"Loaded .env from {env_path}")
else:
    print(".env file not found — skipping")

# Try to inject Infisical secrets using local voice_secrets module (standalone)
try:
    # import path is `src.voice_secrets` because PYTHONPATH=/app and src/ is inside /app
    from src.voice_secrets import inject_infisical_secrets  # type: ignore

    inject_infisical_secrets()
    print("Infisical secrets injected (if credentials present)")
except Exception as e:
    print(f"inject_infisical_secrets() not found or failed to import: {e}")


class VoiceSettings(BaseSettings):
    LIVEKIT_URL: str
    LIVEKIT_API_KEY: str
    LIVEKIT_API_SECRET: str
    ELEVENLABS_API_KEY: str
    ELEVENLABS_TTS_MODEL: str = "eleven_multilingual_v1"
    ELEVENLABS_VOICE_ID: str = "alloy"
    GAIA_BACKEND_URL: str = os.getenv("GAIA_BACKEND_URL", "https://api.heygaia.io")

    model_config = SettingsConfigDict(extra="allow", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> VoiceSettings:
    os.getenv("ENV", "development")
    return VoiceSettings()


voice_settings = get_settings()
