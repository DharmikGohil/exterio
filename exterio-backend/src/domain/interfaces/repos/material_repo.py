from abc import ABC, abstractmethod

from domain.entities.material_entity import Material


class IMaterialRepository(ABC):
    @abstractmethod
    def find_all(self) -> list[Material]: ...

    @abstractmethod
    def find_by_id(self, material_id: str) -> Material | None: ...
