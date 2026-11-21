from typing import Literal

from pydantic import Field

from presentation.schemas.base_schema import CamelModel


class ChatMessageSchema(CamelModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AdvisorChatRequest(CamelModel):
    project_id: str
    design_id: str | None = None
    messages: list[ChatMessageSchema] = Field(min_length=1, max_length=40)


class AdvisorSourceSchema(CamelModel):
    title: str


class AdvisorChatResponse(CamelModel):
    reply: str
    sources: list[AdvisorSourceSchema]
