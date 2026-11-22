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


# Events of a streamed answer, in the order they are sent: each step as it starts and finishes,
# the answer text in pieces, then either the finished reply or an error.


@dataclass(frozen=True)
class AdvisorStepEventDTO:
    """One stage of the work behind an answer (searching the notes, reading the design...)."""

    key: str
    label: str
    status: str  # "running" or "done"
    detail: str = ""


@dataclass(frozen=True)
class AdvisorTextEventDTO:
    """The next piece of the answer's text."""

    text: str


@dataclass(frozen=True)
class AdvisorDoneEventDTO:
    """The whole answer, as the homeowner should finally see it."""

    reply: AdvisorReplyDTO


@dataclass(frozen=True)
class AdvisorErrorEventDTO:
    """The answer failed after the stream had started."""

    message: str


AdvisorEventDTO = (
    AdvisorStepEventDTO | AdvisorTextEventDTO | AdvisorDoneEventDTO | AdvisorErrorEventDTO
)
