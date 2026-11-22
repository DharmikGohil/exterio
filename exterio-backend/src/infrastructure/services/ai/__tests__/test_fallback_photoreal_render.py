import pytest

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import IPhotorealRenderService, RenderFinish
from infrastructure.services.ai.fallback_photoreal_render_service import (
    FallbackPhotorealRenderService,
)


class StubRenderer(IPhotorealRenderService):
    def __init__(self, name: str, *, available: bool = True, fails: bool = False) -> None:
        self.name = name
        self._available = available
        self._fails = fails
        self.calls = 0

    def is_available(self) -> bool:
        return self._available

    def daily_limit(self) -> int:
        return 10

    def render(self, composite: bytes, finishes: tuple[RenderFinish, ...]) -> bytes:
        self.calls += 1
        if self._fails:
            raise AiProviderError(f"{self.name} is busy")
        return self.name.encode()


def test_the_first_renderer_is_used_when_it_works():
    gemini, modal = StubRenderer("gemini"), StubRenderer("modal")

    actual = FallbackPhotorealRenderService([gemini, modal]).render(b"x", ())

    assert actual == b"gemini"
    assert modal.calls == 0


def test_a_failed_render_falls_back_to_the_next_renderer():
    gemini, modal = StubRenderer("gemini", fails=True), StubRenderer("modal")

    actual = FallbackPhotorealRenderService([gemini, modal]).render(b"x", ())

    assert actual == b"modal"


def test_renderers_that_are_not_configured_are_skipped():
    renderer = FallbackPhotorealRenderService(
        [StubRenderer("gemini", available=False), StubRenderer("modal")]
    )

    assert renderer.is_available()
    assert renderer.render(b"x", ()) == b"modal"


def test_when_every_renderer_fails_the_last_error_is_raised():
    renderer = FallbackPhotorealRenderService(
        [StubRenderer("gemini", fails=True), StubRenderer("modal", fails=True)]
    )

    with pytest.raises(AiProviderError, match="modal is busy"):
        renderer.render(b"x", ())
