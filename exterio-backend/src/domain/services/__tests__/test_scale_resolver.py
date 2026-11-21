import pytest

from domain.entities.region_entity import RegionLabel
from domain.entities.scale_reference_entity import ScaleMethod
from domain.errors.project_errors import InvalidScaleError
from domain.services.__tests__.builders import build_region, build_scale, build_surface
from domain.services.scale_resolver import resolve_scale


def test_facade_dimensions_gives_separate_horizontal_and_vertical_scale():
    input_scale = build_scale(facade_width_ft=30.0, facade_height_ft=20.0)
    input_surface = build_surface({}, facade_width_px=600.0, facade_height_px=500.0)

    actual = resolve_scale(input_scale, input_surface, ())

    assert actual.method == ScaleMethod.FACADE_DIMENSIONS
    assert actual.feet_per_pixel_x == pytest.approx(0.05)
    assert actual.feet_per_pixel_y == pytest.approx(0.04)
    assert actual.confidence_pct == 8.0


def test_reference_line_uses_its_rectified_length():
    input_scale = build_scale(ScaleMethod.REFERENCE_LINE, reference_length_ft=12.0)
    input_surface = build_surface({}, reference_line_px=240.0)

    actual = resolve_scale(input_scale, input_surface, ())

    assert actual.feet_per_pixel_x == pytest.approx(0.05)
    assert actual.feet_per_pixel_y == pytest.approx(0.05)
    assert actual.confidence_pct == 12.0


def test_door_height_uses_the_tallest_door():
    input_regions = (build_region("d1", RegionLabel.DOOR), build_region("d2", RegionLabel.DOOR))
    input_surface = build_surface({"d1": (0, 30, 70), "d2": (0, 30, 140)})
    input_scale = build_scale(ScaleMethod.DOOR_HEIGHT, door_height_ft=7.0)

    actual = resolve_scale(input_scale, input_surface, input_regions)

    assert actual.method == ScaleMethod.DOOR_HEIGHT
    assert actual.feet_per_pixel_y == pytest.approx(0.05)
    assert actual.confidence_pct == 20.0


def test_storey_height_assumes_ten_feet_per_storey():
    input_scale = build_scale(ScaleMethod.STOREY_HEIGHT, storeys=2)
    input_surface = build_surface({}, facade_height_px=400.0)

    actual = resolve_scale(input_scale, input_surface, ())

    assert actual.feet_per_pixel_y == pytest.approx(0.05)
    assert actual.confidence_pct == 30.0


def test_missing_door_falls_back_to_storey_height_and_says_so():
    input_scale = build_scale(ScaleMethod.DOOR_HEIGHT, storeys=1)

    actual = resolve_scale(input_scale, build_surface({}), ())

    assert actual.method == ScaleMethod.STOREY_HEIGHT
    assert "fallback" in actual.note


def test_reference_line_without_length_falls_back_to_door():
    input_regions = (build_region("d1", RegionLabel.DOOR),)
    input_surface = build_surface({"d1": (0, 30, 70)})
    input_scale = build_scale(ScaleMethod.REFERENCE_LINE, reference_length_ft=None)

    actual = resolve_scale(input_scale, input_surface, input_regions)

    assert actual.method == ScaleMethod.DOOR_HEIGHT


def test_storey_method_never_silently_switches_to_door():
    input_regions = (build_region("d1", RegionLabel.DOOR),)
    input_surface = build_surface({"d1": (0, 30, 70)})

    actual = resolve_scale(build_scale(ScaleMethod.STOREY_HEIGHT), input_surface, input_regions)

    assert actual.method == ScaleMethod.STOREY_HEIGHT


def test_degenerate_facade_is_rejected():
    with pytest.raises(InvalidScaleError):
        resolve_scale(build_scale(), build_surface({}, facade_width_px=0.0), ())
