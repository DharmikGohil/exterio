from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.project.create_project_usecase import CreateProjectUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectNameRequest, ProjectResponse


class CreateProjectController:
    def __init__(self, create_project: CreateProjectUseCase) -> None:
        self._create_project = create_project

    def handle(
        self, body: ProjectNameRequest, user: UserDTO = Depends(get_authenticated_user)
    ) -> ProjectResponse:
        return ProjectResponse.model_validate(self._create_project.execute(user.id, body.name))
