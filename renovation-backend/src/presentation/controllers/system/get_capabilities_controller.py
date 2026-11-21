from domain.use_cases.system.get_capabilities_usecase import GetCapabilitiesUseCase
from presentation.schemas.project_schema import CapabilitiesResponse


class GetCapabilitiesController:
    def __init__(self, get_capabilities: GetCapabilitiesUseCase) -> None:
        self._get_capabilities = get_capabilities

    def handle(self) -> CapabilitiesResponse:
        return CapabilitiesResponse.model_validate(self._get_capabilities.execute())
