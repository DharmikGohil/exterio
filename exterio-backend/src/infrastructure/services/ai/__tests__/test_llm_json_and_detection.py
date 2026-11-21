import pytest

from domain.entities.region_entity import RegionLabel
from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import DetectedRegion, ISegmentationService
from infrastructure.services.ai.anthropic_json import build_anthropic_client, extract_json_object
from infrastructure.services.ai.anthropic_vision_segmentation_service import (
    AnthropicVisionSegmentationService,
    DetectedPoint,
)
from infrastructure.services.ai.fallback_segmentation_service import FallbackSegmentationService


class StubSegmentation(ISegmentationService):
    def __init__(self, available: bool, label: RegionLabel) -> None:
        self._available = available
        self._label = label

    def is_available(self) -> bool:
        return self._available

    def detect(self, image: bytes, width: int, height: int) -> list[DetectedRegion]:
        return [DetectedRegion(self._label, ((0.0, 0.0), (1.0, 0.0), (1.0, 1.0)), 1.0)]


@pytest.mark.parametrize(
    "input_text",
    [
        '{"issues": []}',
        '```json\n{"issues": []}\n```',
        'Here is the result:\n{"issues": []}\nLet me know if you need more.',
    ],
)
def test_json_is_extracted_from_plain_fenced_and_chatty_replies(input_text):
    assert extract_json_object(input_text) == {"issues": []}


@pytest.mark.parametrize("input_text", ["Yes, this is a house.", "[1, 2, 3]", "{not json}"])
def test_replies_without_a_json_object_are_rejected(input_text):
    with pytest.raises(ValueError):
        extract_json_object(input_text)


def test_no_api_key_means_no_client():
    assert build_anthropic_client("", "", 30) is None


def test_detection_accepts_points_as_pairs_and_alternative_key_names():
    input_raw = {
        "regions": [
            {"label": "window", "points": [[100, 100], [200, 100], [200, 200], [100, 200]]},
            {"label": "door", "polygon": [{"x": 1, "y": 2}, {"x": 3, "y": 4}, {"x": 5, "y": 9}]},
            "garbage",
        ]
    }

    actual = AnthropicVisionSegmentationService._normalise(input_raw)

    assert actual["regions"][0] == {
        "label": "window",
        "name": None,
        "polygon": [
            {"x": 100, "y": 100},
            {"x": 200, "y": 100},
            {"x": 200, "y": 200},
            {"x": 100, "y": 200},
        ],
    }
    assert len(actual["regions"]) == 2


SQUARE_POINTS = [[100, 100], [200, 100], [200, 200], [100, 200]]


@pytest.mark.parametrize(
    ("raw_label", "raw_name", "expected"),
    [
        ("roof", None, ("roof", None)),
        ("Garage door", None, ("garage_door", None)),
        ("garage-door", None, ("garage_door", None)),
        ("other", "Solar panels", ("other", "Solar panels")),
        ("solar_panel", None, ("other", "Solar panel")),
        ("water tank", "Overhead tank", ("other", "Overhead tank")),
        (None, None, ("other", None)),
    ],
)
def test_any_label_is_kept_known_ones_mapped_new_ones_named(raw_label, raw_name, expected):
    item = {"label": raw_label, "points": SQUARE_POINTS}
    if raw_name is not None:
        item["name"] = raw_name

    actual = AnthropicVisionSegmentationService._normalise({"regions": [item]})["regions"][0]

    assert (actual["label"], actual["name"]) == expected


def test_normalised_corners_are_scaled_to_pixels_and_clamped():
    input_points = [
        DetectedPoint(x=0, y=0),
        DetectedPoint(x=500, y=0),
        DetectedPoint(x=1200, y=1000),
    ]

    actual = AnthropicVisionSegmentationService._to_pixels(input_points, 1600, 1000)

    assert actual == ((0.0, 0.0), (800.0, 0.0), (1600.0, 1000.0))


def test_degenerate_polygons_are_dropped():
    two_points = [DetectedPoint(x=0, y=0), DetectedPoint(x=10, y=10)]
    sliver = [DetectedPoint(x=10, y=10), DetectedPoint(x=11, y=10), DetectedPoint(x=11, y=11)]

    assert AnthropicVisionSegmentationService._to_pixels(two_points, 1600, 1000) is None
    assert AnthropicVisionSegmentationService._to_pixels(sliver, 1600, 1000) is None


def test_fallback_uses_the_first_available_provider():
    input_providers = [
        StubSegmentation(False, RegionLabel.WALL),
        StubSegmentation(True, RegionLabel.DOOR),
        StubSegmentation(True, RegionLabel.GATE),
    ]

    actual = FallbackSegmentationService(input_providers)

    assert actual.is_available()
    assert actual.detect(b"", 10, 10)[0].label == RegionLabel.DOOR


def test_fallback_with_no_provider_configured_is_unavailable():
    actual = FallbackSegmentationService([StubSegmentation(False, RegionLabel.WALL)])

    assert not actual.is_available()
    with pytest.raises(AiProviderError):
        actual.detect(b"", 10, 10)
