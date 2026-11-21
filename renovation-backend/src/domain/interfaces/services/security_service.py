from abc import ABC, abstractmethod


class IPasswordHasher(ABC):
    @abstractmethod
    def hash(self, password: str) -> str: ...

    @abstractmethod
    def verify(self, password: str, password_hash: str) -> bool: ...


class ITokenService(ABC):
    @abstractmethod
    def issue(self, user_id: str) -> str: ...

    @abstractmethod
    def verify(self, token: str) -> str | None:
        """Return the user id for a valid token, otherwise None."""
