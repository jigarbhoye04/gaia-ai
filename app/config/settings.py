from pydantic_settings import BaseSettings
from pydantic import computed_field


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

    # Hugging Face Configuration
    USE_HUGGINGFACE_API: bool = True
    HUGGINGFACE_API_KEY: str
    HUGGINGFACE_IMAGE_MODEL: str = "Salesforce/blip-image-captioning-large"
    HUGGINGFACE_ZSC_MODEL: str = "facebook/bart-large-mnli"
    HUGGINGFACE_API_URL: str = "https://api-inference.huggingface.co/models/"
    HUGGINGFACE_ROUTER_URL: str = "https://router.huggingface.co/hf-inference/models/"

    @computed_field
    def huggingface_api_url(self) -> str:
        """Construct the full Hugging Face API URL for zero-shot classification."""
        return f"{self.HUGGINGFACE_API_URL}{self.HUGGINGFACE_ZSC_MODEL}"

    # LLM Service
    LLM_URL: str = "https://llm.aryanranderiya1478.workers.dev/"

    # Environment & Deployment
    ENV: str = "production"

    @computed_field
    def ENABLE_PROFILING(self) -> bool:
        """Enable profiling only in non-production environments."""
        return self.ENV != "production"

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

    class Config:
        """Configuration for environment file settings."""

        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"


settings = Settings()
