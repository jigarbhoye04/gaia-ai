from pydantic_settings import BaseSettings
from pydantic import computed_field


class Settings(BaseSettings):
    """Configuration settings for the application."""

    MONGO_DB: str
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    REDIS_URL: str
    CLOUDFLARE_ACCOUNTID: str
    CLOUDFLARE_AUTH_TOKEN: str
    BING_API_KEY_1: str
    BING_SEARCH_URL: str = "https://api.bing.microsoft.com/v7.0/search"
    ASSEMBLYAI_API_KEY: str
    DEEPGRAM_API_KEY: str
    LLM_URL: str = "https://llm.aryanranderiya1478.workers.dev/"
    ENV: str = "production"
    GROQ_API_KEY: str
    GOOGLE_USERINFO_URL: str = "https://www.googleapis.com/oauth2/v2/userinfo"
    GOOGLE_TOKEN_URL: str = "https://oauth2.googleapis.com/token"

    @computed_field
    def ENABLE_PROFILING(self) -> bool:
        return False if self.ENV == "production" else True

    @computed_field
    def GOOGLE_REDIRECT_URI(self) -> str:
        return (
            "https://heygaia.io"
            if self.ENV == "production"
            else "http://localhost:3000"
        )

    @computed_field
    def HOST(self) -> str:
        return (
            "https://api.heygaia.io"
            if self.ENV == "production"
            else "http://localhost:8000"
        )

    @computed_field
    def FRONTEND_URL(self) -> str:
        return "heygaia.io" if self.ENV == "production" else "localhost:3000"

    @computed_field
    def GOOGLE_CALLBACK_URL(self) -> str:
        return f"{self.HOST}/api/v1/oauth/google/callback"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"


settings = Settings()
