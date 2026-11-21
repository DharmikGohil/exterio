from domain.interfaces.dtos.project_dto import CapabilitiesDTO
from domain.interfaces.services.advisor_service import IAdvisorLanguageModel
from domain.interfaces.services.image_services import (
    IPhotorealRenderService,
    ISegmentationService,
    IVisionCheckService,
)


class GetCapabilitiesUseCase:
    """Tells the UI which AI features have a provider configured."""

    def __init__(
        self,
        segmentation: ISegmentationService,
        photoreal: IPhotorealRenderService,
        vision: IVisionCheckService,
        advisor: IAdvisorLanguageModel,
    ) -> None:
        self._segmentation = segmentation
        self._photoreal = photoreal
        self._vision = vision
        self._advisor = advisor

    def execute(self) -> CapabilitiesDTO:
        return CapabilitiesDTO(
            auto_detect=self._segmentation.is_available(),
            photoreal_render=self._photoreal.is_available(),
            vision_check=self._vision.is_available(),
            advisor=self._advisor.is_available(),
        )
