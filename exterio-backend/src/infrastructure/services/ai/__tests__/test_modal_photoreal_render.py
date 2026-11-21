import base64
import json

import httpx
import pytest

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import RenderFinish
from infrastructure.services.ai.modal_photoreal_render_service import ModalPhotorealRenderService

URL = "https://example--exterio-render-renderer-render.modal.run"
FINISHES = (RenderFinish("wall", "Exterior emulsion - Warm Cream", "Smooth acrylic paint"),)


def build(handler, url=URL, token="secret-token"):
    return ModalPhotorealRenderService(url, token, 30, 10, transport=httpx.MockTransport(handler))


def test_is_off_until_both_the_url_and_the_token_are_set():
    assert build(lambda _: httpx.Response(200), url="").is_available() is False
    assert build(lambda _: httpx.Response(200), token=" ").is_available() is False
    assert build(lambda _: httpx.Response(200)).is_available() is True


def test_sends_the_preview_and_a_diffusion_prompt_with_the_bearer_token():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers["authorization"]
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, content=b"jpeg-bytes", headers={"content-type": "image/jpeg"})

    actual = build(handler).render(b"preview", FINISHES)

    assert actual == b"jpeg-bytes"
    assert seen["auth"] == "Bearer secret-token"
    assert base64.b64decode(seen["body"]["image_base64"]) == b"preview"
    assert "warm cream on the wall" in seen["body"]["prompt"]
    assert seen["body"]["negative_prompt"]


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(401, text="Invalid render token"),
        httpx.Response(500, text="CUDA out of memory"),
        httpx.Response(200, content=b"{}", headers={"content-type": "application/json"}),
        httpx.Response(200, content=b"", headers={"content-type": "image/jpeg"}),
    ],
)
def test_any_bad_answer_becomes_a_friendly_provider_error(response):
    with pytest.raises(AiProviderError):
        build(lambda _: response).render(b"preview", FINISHES)


def test_a_timeout_becomes_a_friendly_provider_error():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("cold start", request=request)

    with pytest.raises(AiProviderError, match="did not respond"):
        build(handler).render(b"preview", FINISHES)
