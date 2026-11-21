from abc import ABC, abstractmethod

from domain.entities.user_entity import User


class IUserRepository(ABC):
    @abstractmethod
    def find_by_id(self, user_id: str) -> User | None: ...

    @abstractmethod
    def find_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    def create(self, user: User) -> User: ...

    @abstractmethod
    def update_password_hash(self, user_id: str, password_hash: str) -> None: ...
