from domain.interfaces.dtos.project_dto import DesignDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.mappers.project_mapper import to_design_dto
from domain.services.project_access import get_owned_design


class GetDesignUseCase:
    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        storage: IFileStorageService,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._storage = storage

    def execute(self, design_id: str, user_id: str) -> DesignDTO:
        design, _ = get_owned_design(self._design_repo, self._project_repo, design_id, user_id)
        return to_design_dto(design, self._storage.url_for)
