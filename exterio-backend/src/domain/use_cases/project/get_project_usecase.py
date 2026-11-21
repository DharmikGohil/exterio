from domain.interfaces.dtos.project_dto import ProjectDTO
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.services.project_access import get_owned_project
from domain.use_cases.project.project_reader import ProjectReader


class GetProjectUseCase:
    def __init__(self, project_repo: IProjectRepository, reader: ProjectReader) -> None:
        self._project_repo = project_repo
        self._reader = reader

    def execute(self, project_id: str, user_id: str) -> ProjectDTO:
        return self._reader.to_dto(get_owned_project(self._project_repo, project_id, user_id))
