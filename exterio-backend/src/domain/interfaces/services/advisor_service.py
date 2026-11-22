from abc import ABC, abstractmethod
from collections.abc import Iterator

from domain.interfaces.dtos.advisor_dto import ChatMessageDTO


class IAdvisorLanguageModel(ABC):
    """Generation side of the material advisor."""

    @abstractmethod
    def is_available(self) -> bool: ...

    @abstractmethod
    def stream(self, system_prompt: str, messages: list[ChatMessageDTO]) -> Iterator[str]:
        """The answer's text in pieces, as the model writes it."""

    def reply(self, system_prompt: str, messages: list[ChatMessageDTO]) -> str:
        """The whole answer at once."""
        return "".join(self.stream(system_prompt, messages)).strip()
