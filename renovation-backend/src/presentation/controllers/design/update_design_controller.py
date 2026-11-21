from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.design.update_design_usecase import UpdateDesignUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import DesignResponse, UpdateDesignRequest


class UpdateDesignController:
    def __init__(self, update_design: UpdateDesignUseCase) -> None:
        self._update_design = update_design

    def handle(
        self,
        design_id: str,
        body: UpdateDesignRequest,
        user: UserDTO = Depends(get_authenticated_user),
    ) -> DesignResponse:
        return DesignResponse.model_validate(
            self._update_design.execute(design_id, user.id, body.name, body.assignments)
        )
