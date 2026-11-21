from abc import ABC, abstractmethod

from domain.interfaces.dtos.advisor_dto import KnowledgeSnippetDTO


class IKnowledgeRepository(ABC):
    """Retrieval side of the material advisor (RAG)."""

    @abstractmethod
    def search(self, query: str, limit: int) -> list[KnowledgeSnippetDTO]: ...
