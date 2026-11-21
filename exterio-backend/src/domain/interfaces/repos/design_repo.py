from abc import ABC, abstractmethod
from datetime import datetime

from domain.entities.design_entity import Design


class IDesignRepository(ABC):
    @abstractmethod
    def find_by_id(self, design_id: str) -> Design | None: ...

    @abstractmethod
    def find_all_by_project(self, project_id: str) -> list[Design]: ...

    @abstractmethod
    def create(self, design: Design) -> Design: ...

    @abstractmethod
    def update(self, design: Design) -> Design: ...

    @abstractmethod
    def delete(self, design_id: str) -> None: ...

    @abstractmethod
    def delete_by_project(self, project_id: str) -> None: ...

    @abstractmethod
    def count_renders_since(self, user_id: str, since: datetime) -> int: ...

    @abstractmethod
    def record_render(self, user_id: str, design_id: str, at: datetime) -> None: ...
