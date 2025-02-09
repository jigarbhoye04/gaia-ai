from pydantic import BaseModel


class TTSRequest(BaseModel):
    text: str
    language_code: str = "en-GB"
    voice_name: str = "en-GB-Journey-F"
