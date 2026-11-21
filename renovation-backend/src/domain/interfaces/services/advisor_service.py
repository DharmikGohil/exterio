from abc import ABC, abstractmethod

from domain.interfaces.dtos.advisor_dto import ChatMessageDTO


class IAdvisorLanguageModel(ABC):
    """Generation side of the material advisor."""

    @abstractmethod
    def is_available(self) -> bool: ...

    @abstractmethod
    def reply(self, system_prompt: str, messages: list[ChatMessageDTO]) -> str: ...
