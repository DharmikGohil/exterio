import json
from typing import Any

import pytest
from google.genai import errors as genai_errors
from google.genai import types

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import RenderFinish
from infrastructure.services.ai.gemini_client import (
    build_gemini_client,
    load_service_account_info,
)
from infrastructure.services.ai.gemini_photoreal_render_service import (
    BUSY_RETRY_SECONDS,
    GeminiPhotorealRenderService,
)
from infrastructure.services.ai.vision_json_client import (
    LlmBusyError,
    LlmUnreachableError,
    LlmUnreadableError,
    VisionJsonClient,
)
from infrastructure.services.ai.vision_llm_check_service import VisionLlmCheckService
from infrastructure.services.ai.vision_llm_segmentation_service import (
    VisionLlmSegmentationService,
)

KEY = {"type": "service_account", "project_id": "demo-project", "private_key": "not-real"}


class FakeJsonClient(VisionJsonClient):
    def __init__(self, reply: dict[str, Any] | None = None, error: Exception | None = None):
        self._reply = reply or {}
        self._error = error

    def is_available(self) -> bool:
        return True

    def request_json(self, image: bytes, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        if self._error is not None:
            raise self._error
        return self._reply


def test_no_vertex_key_means_no_gemini_client():
    assert build_gemini_client("", "global", 30) is None
    assert build_gemini_client("   ", "global", 30) is None


def test_the_key_is_read_from_its_json_or_from_its_file(tmp_path):
    key_file = tmp_path / "key.json"
    key_file.write_text(json.dumps(KEY))

    assert load_service_account_info(json.dumps(KEY))["project_id"] == "demo-project"
    assert load_service_account_info(str(key_file))["project_id"] == "demo-project"


@pytest.mark.parametrize("credentials", ["/no/such/key.json", "{not json", '{"type": "user"}'])
def test_a_bad_key_fails_loudly_without_echoing_it(credentials):
    with pytest.raises(ValueError) as error:
        load_service_account_info(credentials)

    assert "not json" not in str(error.value)


def test_the_photo_check_never_blocks_an_upload_when_the_model_fails():
    for error in (LlmBusyError("busy"), LlmUnreachableError("down"), AiProviderError("x")):
        verdict = VisionLlmCheckService(FakeJsonClient(error=error)).check(b"jpeg")

        assert verdict.issues == () and verdict.guidance == ()


def test_the_photo_check_reads_the_models_issues():
    reply = {
        "issues": [
            {"code": "NIGHT", "severity": "warning", "message": "Too dark.", "tip": "Shoot by day."}
        ]
    }

    verdict = VisionLlmCheckService(FakeJsonClient(reply=reply)).check(b"jpeg")

    assert [issue.code for issue in verdict.issues] == ["NIGHT"]
    assert verdict.guidance == ("Shoot by day.",)


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (LlmBusyError("x"), "busy"),
        (LlmUnreachableError("x"), "could not be reached"),
        (LlmUnreadableError("x"), "unreadable"),
        (AiProviderError("x"), "failed"),
    ],
)
def test_detection_explains_each_kind_of_failure(error, expected):
    detection = VisionLlmSegmentationService(FakeJsonClient(error=error))

    with pytest.raises(AiProviderError) as raised:
        detection.detect(b"jpeg", 1000, 800)

    assert expected in str(raised.value)


class StreamingJsonClient(FakeJsonClient):
    """Writes its answer a few characters at a time, recording how far it has got."""

    def __init__(self, text: str) -> None:
        super().__init__()
        self._text = text
        self.written = 0

    def stream_json_text(self, image: bytes, prompt: str, schema: dict[str, Any]):
        for index in range(0, len(self._text), 5):
            self.written = index + 5
            yield self._text[index : index + 5]


def test_detection_hands_over_each_part_before_the_model_has_finished():
    answer = json.dumps(
        {
            "regions": [
                {"label": "wall", "polygon": [[100, 100], [900, 100], [900, 700], [100, 700]]},
                {"label": "door", "polygon": [[450, 490], [550, 490], [550, 700], [450, 700]]},
            ]
        }
    )
    client = StreamingJsonClient(answer)
    stream = VisionLlmSegmentationService(client).detect_stream(b"jpeg", 1000, 800)

    first = next(stream)

    assert first.label == "wall"
    assert client.written < len(answer), "the first part must arrive while the answer is written"
    assert [region.label for region in stream] == ["door"]


class _Part:
    def __init__(self, data: bytes | None) -> None:
        self.inline_data = type("Inline", (), {"data": data})() if data is not None else None


def _image_response(data: bytes | None):
    parts = [_Part(None), _Part(data)] if data else [_Part(None)]
    content = type("Content", (), {"parts": parts})()
    candidate = type(
        "Candidate", (), {"content": content, "finish_reason": types.FinishReason.STOP}
    )()
    return type("Response", (), {"candidates": [candidate], "prompt_feedback": None})()


class _FakeGemini:
    def __init__(self, response) -> None:
        self.calls: list[dict[str, Any]] = []
        self.models = self
        self._response = response

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return self._response


def test_gemini_render_returns_the_edited_image_and_asks_for_an_image():
    client = _FakeGemini(_image_response(b"edited-jpeg"))
    renderer = GeminiPhotorealRenderService(client, "image-model", 10)  # type: ignore[arg-type]

    actual = renderer.render(b"preview", (RenderFinish("wall", "Sage paint", "matt"),))

    assert actual == b"edited-jpeg"
    assert client.calls[0]["config"].response_modalities == ["IMAGE"]


def test_gemini_render_without_an_image_is_an_error():
    client = _FakeGemini(_image_response(None))
    renderer = GeminiPhotorealRenderService(client, "m", 10)  # type: ignore[arg-type]

    with pytest.raises(AiProviderError):
        renderer.render(b"preview", ())


class _BusyThenFine(_FakeGemini):
    """Rate limited on the first call, then answers."""

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        if len(self.calls) == 1:
            raise genai_errors.ClientError(429, {"error": {"message": "busy"}})
        return self._response


def test_gemini_render_waits_and_retries_once_when_rate_limited():
    client = _BusyThenFine(_image_response(b"edited"))
    waits: list[float] = []
    renderer = GeminiPhotorealRenderService(client, "m", 10, sleep=waits.append)  # type: ignore[arg-type]

    actual = renderer.render(b"preview", ())

    assert actual == b"edited"
    assert len(client.calls) == 2
    assert waits == [BUSY_RETRY_SECONDS]
