from abc import ABC, abstractmethod

from domain.entities.project_entity import Project


class IProjectRepository(ABC):
    @abstractmethod
    def find_by_id(self, project_id: str) -> Project | None: ...

    @abstractmethod
    def find_all_by_user(self, user_id: str) -> list[Project]: ...

    @abstractmethod
    def create(self, project: Project) -> Project: ...

    @abstractmethod
    def update(self, project: Project) -> Project: ...

    @abstractmethod
    def delete(self, project_id: str) -> None: ...
