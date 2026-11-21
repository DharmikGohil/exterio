from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.project.create_sample_project_usecase import CreateSampleProjectUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectResponse


class CreateSampleProjectController:
    def __init__(self, create_sample_project: CreateSampleProjectUseCase) -> None:
        self._create_sample_project = create_sample_project

    def handle(self, user: UserDTO = Depends(get_authenticated_user)) -> ProjectResponse:
        return ProjectResponse.model_validate(self._create_sample_project.execute(user.id))
