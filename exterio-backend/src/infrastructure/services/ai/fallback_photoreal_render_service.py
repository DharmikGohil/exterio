"""Tries photoreal renderers in order of preference until one succeeds."""

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import IPhotorealRenderService, RenderFinish
from infrastructure.utils.logger import logger


class FallbackPhotorealRenderService(IPhotorealRenderService):
    """The first configured renderer handles the request; if it fails (busy, unreachable, an
    empty answer), the next one does, so Generate render works whenever any renderer can."""

    def __init__(self, renderers: list[IPhotorealRenderService]) -> None:
        self._renderers = renderers

    def _available(self) -> list[IPhotorealRenderService]:
        return [renderer for renderer in self._renderers if renderer.is_available()]

    def is_available(self) -> bool:
        return bool(self._available())

    def daily_limit(self) -> int:
        available = self._available()
        return available[0].daily_limit() if available else 0

    def render(self, composite: bytes, finishes: tuple[RenderFinish, ...]) -> bytes:
        failure: AiProviderError | None = None
        for renderer in self._available():
            try:
                return renderer.render(composite, finishes)
            except AiProviderError as error:
                logger.warning(
                    "Photoreal render failed on %s, trying the next renderer: %s",
                    type(renderer).__name__,
                    error,
                )
                failure = error
        raise failure or AiProviderError("The photoreal render is not configured")
