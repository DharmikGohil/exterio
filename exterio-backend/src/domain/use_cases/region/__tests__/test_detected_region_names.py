import pytest

from domain.entities.region_entity import RegionLabel
from domain.interfaces.services.image_services import DetectedRegion
from domain.use_cases.region.detect_regions_usecase import _region_name

SQUARE = ((0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0))


def detected(label: RegionLabel, name: str | None = None) -> DetectedRegion:
    return DetectedRegion(label=label, polygon=SQUARE, score=0.5, name=name)


def test_stock_parts_are_numbered_by_type():
    assert _region_name(detected(RegionLabel.GARAGE_DOOR, "big door"), 2) == "Garage door 2"


def test_other_parts_keep_the_name_the_detector_gave_them():
    assert _region_name(detected(RegionLabel.OTHER, "solar   panels"), 1) == "Solar panels"


@pytest.mark.parametrize("name", [None, "", "   "])
def test_other_parts_without_a_name_are_numbered(name):
    assert _region_name(detected(RegionLabel.OTHER, name), 3) == "Other part 3"


def test_long_names_are_cut_to_fit():
    actual = _region_name(detected(RegionLabel.OTHER, "a" * 80), 1)

    assert len(actual) == 40
