from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.project_entity import Project
from domain.interfaces.dtos.project_dto import ProjectDTO
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.use_cases.project.project_reader import ProjectReader

DEFAULT_PROJECT_NAME = "My house"
MAX_PROJECT_NAME_LENGTH = 80


def clean_project_name(name: str) -> str:
    return name.strip()[:MAX_PROJECT_NAME_LENGTH] or DEFAULT_PROJECT_NAME


class CreateProjectUseCase:
    def __init__(self, project_repo: IProjectRepository, reader: ProjectReader) -> None:
        self._project_repo = project_repo
        self._reader = reader

    def execute(self, user_id: str, name: str) -> ProjectDTO:
        now = datetime.now(UTC)
        project = self._project_repo.create(
            Project(
                id=str(uuid4()),
                user_id=user_id,
                name=clean_project_name(name),
                created_at=now,
                updated_at=now,
            )
        )
        return self._reader.to_dto(project)
