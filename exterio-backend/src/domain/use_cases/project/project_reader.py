from domain.entities.project_entity import Project
from domain.interfaces.dtos.project_dto import ProjectDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.mappers.project_mapper import to_project_dto


class ProjectReader:
    """Builds the full project response (project + its designs) in one place."""

    def __init__(self, design_repo: IDesignRepository, storage: IFileStorageService) -> None:
        self._design_repo = design_repo
        self._storage = storage

    def to_dto(self, project: Project) -> ProjectDTO:
        designs = self._design_repo.find_all_by_project(project.id)
        return to_project_dto(project, designs, self._storage.url_for)
