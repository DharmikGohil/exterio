from fastapi import Depends

from domain.entities.scale_reference_entity import ScaleReference
from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.project.update_scale_usecase import UpdateScaleUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectResponse, ScaleReferenceSchema


class UpdateScaleController:
    def __init__(self, update_scale: UpdateScaleUseCase) -> None:
        self._update_scale = update_scale

    def handle(
        self,
        project_id: str,
        body: ScaleReferenceSchema,
        user: UserDTO = Depends(get_authenticated_user),
    ) -> ProjectResponse:
        tl, tr, br, bl = body.facade_corners
        line = body.reference_line
        scale = ScaleReference(
            method=body.method,
            facade_corners=(tl, tr, br, bl),
            reference_line=(line[0], line[1]) if line else None,
            reference_length_ft=body.reference_length_ft,
            facade_width_ft=body.facade_width_ft,
            facade_height_ft=body.facade_height_ft,
            storeys=body.storeys,
            door_height_ft=body.door_height_ft,
        )
        return ProjectResponse.model_validate(
            self._update_scale.execute(project_id, user.id, scale)
        )
