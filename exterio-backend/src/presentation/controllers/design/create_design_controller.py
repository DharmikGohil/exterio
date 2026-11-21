from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.design.create_design_usecase import CreateDesignUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import CreateDesignRequest, DesignResponse


class CreateDesignController:
    def __init__(self, create_design: CreateDesignUseCase) -> None:
        self._create_design = create_design

    def handle(
        self,
        project_id: str,
        body: CreateDesignRequest,
        user: UserDTO = Depends(get_authenticated_user),
    ) -> DesignResponse:
        return DesignResponse.model_validate(
            self._create_design.execute(project_id, user.id, body.name, body.copy_from_design_id)
        )
