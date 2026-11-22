"""Uses the region-detection providers in order of preference, moving on when one fails."""

from collections.abc import Iterator

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import DetectedRegion, ISegmentationService
from infrastructure.utils.logger import logger


class FallbackSegmentationService(ISegmentationService):
    """Providers are tried in order of preference. The first available one handles the request;
    if it fails before finding a single part (unreachable, timed out, busy, no answer), the next
    available one is asked instead. A provider that fails after parts have already been shown is
    not replaced, because the user is already looking at its parts."""

    def __init__(self, providers: list[ISegmentationService]) -> None:
        self._providers = providers

    def is_available(self) -> bool:
        return any(provider.is_available() for provider in self._providers)

    def detect(self, image: bytes, width: int, height: int) -> list[DetectedRegion]:
        return list(self.detect_stream(image, width, height))

    def detect_stream(self, image: bytes, width: int, height: int) -> Iterator[DetectedRegion]:
        available = [provider for provider in self._providers if provider.is_available()]
        if not available:
            raise AiProviderError("Automatic region detection is not configured")
        for index, provider in enumerate(available):
            found = 0
            try:
                for region in provider.detect_stream(image, width, height):
                    found += 1
                    yield region
                return
            except AiProviderError as error:
                is_last = index == len(available) - 1
                if found or is_last:
                    raise
                logger.warning(
                    "Region detection by %s failed (%s); trying the next provider",
                    type(provider).__name__,
                    error,
                )
