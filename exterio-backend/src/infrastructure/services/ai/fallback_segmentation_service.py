"""Uses the first configured region-detection provider."""

from collections.abc import Iterator

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import DetectedRegion, ISegmentationService


class FallbackSegmentationService(ISegmentationService):
    """Providers are tried in order of preference; the first available one handles the request."""

    def __init__(self, providers: list[ISegmentationService]) -> None:
        self._providers = providers

    def is_available(self) -> bool:
        return any(provider.is_available() for provider in self._providers)

    def detect(self, image: bytes, width: int, height: int) -> list[DetectedRegion]:
        return list(self.detect_stream(image, width, height))

    def detect_stream(self, image: bytes, width: int, height: int) -> Iterator[DetectedRegion]:
        for provider in self._providers:
            if provider.is_available():
                yield from provider.detect_stream(image, width, height)
                return
        raise AiProviderError("Automatic region detection is not configured")
