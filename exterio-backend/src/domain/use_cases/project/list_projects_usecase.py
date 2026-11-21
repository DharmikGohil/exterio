from domain.interfaces.dtos.project_dto import ProjectSummaryDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.mappers.project_mapper import to_project_summary_dto


class ListProjectsUseCase:
    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        storage: IFileStorageService,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._storage = storage

    def execute(self, user_id: str) -> list[ProjectSummaryDTO]:
        projects = self._project_repo.find_all_by_user(user_id)
        counts = self._design_repo.count_by_projects([project.id for project in projects])
        return [
            to_project_summary_dto(project, counts.get(project.id, 0), self._storage.url_for)
            for project in projects
        ]
