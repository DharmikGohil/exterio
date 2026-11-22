import json
from typing import Any

import pytest

from domain.errors.project_errors import AiProviderError
from infrastructure.services.ai.gemini_client import (
    build_gemini_client,
    load_service_account_info,
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
