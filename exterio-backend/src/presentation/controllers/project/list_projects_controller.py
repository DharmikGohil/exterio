from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.project.list_projects_usecase import ListProjectsUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectSummaryResponse


class ListProjectsController:
    def __init__(self, list_projects: ListProjectsUseCase) -> None:
        self._list_projects = list_projects

    def handle(
        self, user: UserDTO = Depends(get_authenticated_user)
    ) -> list[ProjectSummaryResponse]:
        return [
            ProjectSummaryResponse.model_validate(item)
            for item in self._list_projects.execute(user.id)
        ]
