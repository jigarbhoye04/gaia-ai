from typing import Union
from pydantic import BaseModel, HttpUrl


class URLRequest(BaseModel):
    url: str

class URLResponse(BaseModel):
    title: Union[str, None] = None
    description: Union[str, None] = None
    favicon: Union[str, None] = None
    website_name: Union[str, None] = None
    url: HttpUrl
