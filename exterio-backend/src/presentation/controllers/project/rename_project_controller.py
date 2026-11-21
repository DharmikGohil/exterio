from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.project.rename_project_usecase import RenameProjectUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectNameRequest, ProjectResponse


class RenameProjectController:
    def __init__(self, rename_project: RenameProjectUseCase) -> None:
        self._rename_project = rename_project

    def handle(
        self,
        project_id: str,
        body: ProjectNameRequest,
        user: UserDTO = Depends(get_authenticated_user),
    ) -> ProjectResponse:
        return ProjectResponse.model_validate(
            self._rename_project.execute(project_id, user.id, body.name)
        )
