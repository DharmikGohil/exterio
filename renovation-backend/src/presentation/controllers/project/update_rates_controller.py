from fastapi import Depends

from domain.entities.project_entity import RateOverride
from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.project.update_rates_usecase import UpdateRatesUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectResponse, UpdateRatesRequest


class UpdateRatesController:
    def __init__(self, update_rates: UpdateRatesUseCase) -> None:
        self._update_rates = update_rates

    def handle(
        self,
        project_id: str,
        body: UpdateRatesRequest,
        user: UserDTO = Depends(get_authenticated_user),
    ) -> ProjectResponse:
        overrides = {
            material_id: RateOverride(
                material_rate=item.material_rate,
                labour_rate=item.labour_rate,
                wastage_pct=item.wastage_pct,
            )
            for material_id, item in body.overrides.items()
        }
        return ProjectResponse.model_validate(
            self._update_rates.execute(project_id, user.id, overrides)
        )
