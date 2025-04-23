# # class State(MessagesState):
# #     force_web_search: bool
# #     force_deep_search: bool
# #     current_datetime: str

# from typing_extensions import TypedDict
# from typing import Annotated
# from langchain_core.messages import AnyMessage
# from langgraph.graph.message import add_messages


# # Define the state schema with a messages list using add_messages reducer
# class State(TypedDict):
#     messages: Annotated[list[AnyMessage], add_messages]
#     force_web_search: bool
#     force_deep_search: bool
#     current_datetime: str

from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_core.messages import AnyMessage


# class DictLikeModel(BaseModel):
#     def get(self, key, default=None):
#         return getattr(self, key, default)

#     def __getitem__(self, key):
#         return getattr(self, key)

#     def __setitem__(self, key, value):
#         return setattr(self, key, value)


# class State(DictLikeModel):
#     messages: List[AnyMessage] = Field(default_factory=list)
#     force_web_search: bool = False
#     force_deep_search: bool = False
#     current_datetime: Optional[str] = None

from collections.abc import MutableMapping


class DictLikeModel(BaseModel, MutableMapping):
    def __getitem__(self, key):
        return getattr(self, key)

    def __setitem__(self, key, value):
        setattr(self, key, value)

    def __delitem__(self, key):
        delattr(self, key)

    def __len__(self):
        return len(self.__dict__)


class State(DictLikeModel):
    query: str = ""
    messages: List[AnyMessage] = Field(default_factory=list)
    force_web_search: bool = False
    force_deep_search: bool = False
    current_datetime: Optional[str] = None
