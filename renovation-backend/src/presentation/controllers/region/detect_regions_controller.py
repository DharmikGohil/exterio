from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.region.detect_regions_usecase import DetectRegionsUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectResponse


class DetectRegionsController:
    def __init__(self, detect_regions: DetectRegionsUseCase) -> None:
        self._detect_regions = detect_regions

    def handle(
        self, project_id: str, user: UserDTO = Depends(get_authenticated_user)
    ) -> ProjectResponse:
        return ProjectResponse.model_validate(self._detect_regions.execute(project_id, user.id))
