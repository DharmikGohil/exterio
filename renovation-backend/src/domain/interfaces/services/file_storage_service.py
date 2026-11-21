from abc import ABC, abstractmethod


class IFileStorageService(ABC):
    @abstractmethod
    def save(self, path: str, data: bytes) -> None: ...

    @abstractmethod
    def read(self, path: str) -> bytes: ...

    @abstractmethod
    def exists(self, path: str) -> bool: ...

    @abstractmethod
    def delete(self, path: str) -> None: ...

    @abstractmethod
    def delete_prefix(self, prefix: str) -> None: ...

    @abstractmethod
    def url_for(self, path: str) -> str: ...
