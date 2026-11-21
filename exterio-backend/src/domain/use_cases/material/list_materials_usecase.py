from domain.interfaces.dtos.project_dto import MaterialDTO
from domain.interfaces.repos.material_repo import IMaterialRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.mappers.project_mapper import to_material_dto


class ListMaterialsUseCase:
    def __init__(self, material_repo: IMaterialRepository, storage: IFileStorageService) -> None:
        self._material_repo = material_repo
        self._storage = storage

    def execute(self) -> list[MaterialDTO]:
        return [
            to_material_dto(material, self._storage.url_for)
            for material in self._material_repo.find_all()
        ]
