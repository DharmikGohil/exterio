from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.interfaces.dtos.project_dto import RegionInputDTO
from domain.use_cases.region.replace_regions_usecase import ReplaceRegionsUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectResponse, ReplaceRegionsRequest


class ReplaceRegionsController:
    def __init__(self, replace_regions: ReplaceRegionsUseCase) -> None:
        self._replace_regions = replace_regions

    def handle(
        self,
        project_id: str,
        body: ReplaceRegionsRequest,
        user: UserDTO = Depends(get_authenticated_user),
    ) -> ProjectResponse:
        inputs = [
            RegionInputDTO(
                id=region.id,
                label=region.label,
                name=region.name,
                polygon=tuple(region.polygon),
                source=region.source,
                surface_multiplier=region.surface_multiplier,
                area_override_sqft=region.area_override_sqft,
                length_override_ft=region.length_override_ft,
            )
            for region in body.regions
        ]
        return ProjectResponse.model_validate(
            self._replace_regions.execute(project_id, user.id, inputs)
        )
