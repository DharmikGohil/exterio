from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.design.get_design_usecase import GetDesignUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import DesignResponse


class GetDesignController:
    def __init__(self, get_design: GetDesignUseCase) -> None:
        self._get_design = get_design

    def handle(
        self, design_id: str, user: UserDTO = Depends(get_authenticated_user)
    ) -> DesignResponse:
        return DesignResponse.model_validate(self._get_design.execute(design_id, user.id))
