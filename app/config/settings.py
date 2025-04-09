import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv('.env')

# Determine which environment file to load
env = os.getenv("ENV", "production")
print(f"Environment variable ENV is set to: {env}")

env_file_name = f".env.{env}" if env != "production" else ".env"
env_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", env_file_name))

# Explicitly load the environment file with python-dotenv
if os.path.exists(env_file_path):
    print(f"Environment file exists, loading it: {env_file_path}")
    load_dotenv(env_file_path, override=True)
    os.environ["ENV_FILE"] = env_file_path
else:
    print(f"Warning: Environment file '{env_file_path}' does not exist. Using default settings.")


class Settings(BaseSettings):
    """Configuration settings for the application."""

    # Cloud Services
    MONGO_DB: str
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    CLOUDFLARE_ACCOUNTID: str
    CLOUDFLARE_AUTH_TOKEN: str
    REDIS_URL: str

    # OAuth & Authentication
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_USERINFO_URL: str = "https://www.googleapis.com/oauth2/v2/userinfo"
    GOOGLE_TOKEN_URL: str = "https://oauth2.googleapis.com/token"

    # External API Keys
    BING_API_KEY_1: str
    BING_SEARCH_URL: str = "https://api.bing.microsoft.com/v7.0/search"
    ASSEMBLYAI_API_KEY: str
    DEEPGRAM_API_KEY: str
    GROQ_API_KEY: str
    OPENWEATHER_API_KEY: str
    GEMINI_API_KEY: str
    LAMINAR_API_KEY: str

    # LLM Service
    LLM_URL: str = "https://llm.aryanranderiya1478.workers.dev/"

    # Environment & Deployment
    ENV: str = "production"
    DISABLE_PROFILING: bool = False
    DUMMY_IP: str = "8.8.8.8"

    # Hugging Face Configuration
    USE_HUGGINGFACE_API: bool = False
    HUGGINGFACE_API_KEY: str
    HUGGINGFACE_IMAGE_MODEL: str = "Salesforce/blip-image-captioning-large"
    HUGGINGFACE_ZSC_MODEL: str = "MoritzLaurer/deberta-v3-base-zeroshot-v2.0"
    HUGGINGFACE_API_URL: str = "https://api-inference.huggingface.co/models/"
    HUGGINGFACE_ROUTER_URL: str = "https://router.huggingface.co/hf-inference/models/"

    @computed_field
    def huggingface_api_url(self) -> str:
        """Construct the full Hugging Face API URL for zero-shot classification."""
        return f"{self.HUGGINGFACE_API_URL}{self.HUGGINGFACE_ZSC_MODEL}"

    # Default ChromaDB connection settings
    CHROMADB_HOST: str
    CHROMADB_PORT: int

    @computed_field
    def ENABLE_PROFILING(self) -> bool:
        """Enable profiling only in non-production environments."""
        return not self.DISABLE_PROFILING and self.ENV != "production"

    @computed_field
    def GOOGLE_REDIRECT_URI(self) -> str:
        """Redirect URI for Google OAuth based on environment."""
        return (
            "https://heygaia.io"
            if self.ENV == "production"
            else "http://localhost:3000"
        )

    @computed_field
    def HOST(self) -> str:
        """API Host URL based on environment."""
        return (
            "https://api.heygaia.io"
            if self.ENV == "production"
            else "http://localhost:8000"
        )

    @computed_field
    def FRONTEND_URL(self) -> str:
        """Frontend base URL based on environment."""
        return (
            "https://heygaia.io"
            if self.ENV == "production"
            else "http://localhost:3000"
        )

    @computed_field
    def GOOGLE_CALLBACK_URL(self) -> str:
        """Google OAuth callback URL."""
        return f"{self.HOST}/api/v1/oauth/google/callback"

    model_config = SettingsConfigDict(env_file=env_file_path, env_file_encoding="utf-8", extra="allow")


settings = Settings()
