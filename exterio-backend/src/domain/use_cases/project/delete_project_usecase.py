from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.services.project_access import get_owned_project


class DeleteProjectUseCase:
    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        storage: IFileStorageService,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._storage = storage

    def execute(self, project_id: str, user_id: str) -> None:
        project = get_owned_project(self._project_repo, project_id, user_id)
        self._design_repo.delete_by_project(project.id)
        self._project_repo.delete(project.id)
        self._storage.delete_prefix(f"projects/{project.id}/")
