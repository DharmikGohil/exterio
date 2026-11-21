"""Uses the first configured region-detection provider."""

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import DetectedRegion, ISegmentationService


class FallbackSegmentationService(ISegmentationService):
    """Providers are tried in order of preference; the first available one handles the request."""

    def __init__(self, providers: list[ISegmentationService]) -> None:
        self._providers = providers

    def is_available(self) -> bool:
        return any(provider.is_available() for provider in self._providers)

    def detect(self, image: bytes, width: int, height: int) -> list[DetectedRegion]:
        for provider in self._providers:
            if provider.is_available():
                return provider.detect(image, width, height)
        raise AiProviderError("Automatic region detection is not configured")
