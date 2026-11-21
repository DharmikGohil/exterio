from dataclasses import dataclass


@dataclass(frozen=True)
class ChatMessageDTO:
    role: str
    content: str


@dataclass(frozen=True)
class KnowledgeSnippetDTO:
    title: str
    text: str
    score: float


@dataclass(frozen=True)
class AdvisorSourceDTO:
    title: str


@dataclass(frozen=True)
class AdvisorReplyDTO:
    reply: str
    sources: tuple[AdvisorSourceDTO, ...]
