from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.estimate.get_design_estimate_usecase import GetDesignEstimateUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.estimate_schema import EstimateResponse


class GetDesignEstimateController:
    def __init__(self, get_estimate: GetDesignEstimateUseCase) -> None:
        self._get_estimate = get_estimate

    def handle(
        self, design_id: str, user: UserDTO = Depends(get_authenticated_user)
    ) -> EstimateResponse:
        return EstimateResponse.model_validate(self._get_estimate.execute(design_id, user.id))
