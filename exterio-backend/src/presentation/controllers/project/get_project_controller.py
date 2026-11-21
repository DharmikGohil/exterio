from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.project.get_project_usecase import GetProjectUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectResponse


class GetProjectController:
    def __init__(self, get_project: GetProjectUseCase) -> None:
        self._get_project = get_project

    def handle(
        self, project_id: str, user: UserDTO = Depends(get_authenticated_user)
    ) -> ProjectResponse:
        return ProjectResponse.model_validate(self._get_project.execute(project_id, user.id))
