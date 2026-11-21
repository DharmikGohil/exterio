import pytest

from domain.entities.region_entity import RegionLabel
from domain.entities.scale_reference_entity import ScaleMethod
from domain.interfaces.dtos.estimate_dto import ResolvedScaleDTO
from domain.services.__tests__.builders import build_region, build_surface
from domain.services.area_calculator import compute_region_areas, summarise_surfaces

# 10 pixels per foot in both directions.
SCALE = ResolvedScaleDTO(ScaleMethod.FACADE_DIMENSIONS, 0.1, 0.1, 8.0, "")


def test_wall_with_window_removed_matches_hand_calculation():
    # A 10 ft x 10 ft wall is 100 x 100 px. A 3 ft x 4 ft window removes 30 x 40 px.
    input_regions = (
        build_region("wall", RegionLabel.WALL),
        build_region("win", RegionLabel.WINDOW),
    )
    input_surface = build_surface(
        {"wall": (100 * 100 - 30 * 40, 100, 100), "win": (30 * 40, 30, 40)}
    )

    actual = compute_region_areas(input_regions, input_surface, SCALE)

    assert actual[0].area_sqft == pytest.approx(88.0)
    assert actual[1].area_sqft == pytest.approx(12.0)
    assert not actual[0].is_override


def test_separate_horizontal_and_vertical_scale_are_both_applied():
    input_scale = ResolvedScaleDTO(ScaleMethod.FACADE_DIMENSIONS, 0.2, 0.1, 8.0, "")
    input_surface = build_surface({"wall": (1000, 50, 20)})

    actual = compute_region_areas(
        (build_region("wall", RegionLabel.WALL),), input_surface, input_scale
    )

    assert actual[0].area_sqft == pytest.approx(20.0)
    assert actual[0].length_ft == pytest.approx(10.0)


def test_pillar_multiplier_counts_hidden_faces():
    input_regions = (build_region("p", RegionLabel.PILLAR, surface_multiplier=3.0),)
    input_surface = build_surface({"p": (15 * 100, 15, 100)})

    actual = compute_region_areas(input_regions, input_surface, SCALE)

    assert actual[0].area_sqft == pytest.approx(45.0)


def test_railing_is_measured_by_length_and_panel_area():
    input_surface = build_surface({"r": (9999, 120, 30)})

    actual = compute_region_areas((build_region("r", RegionLabel.RAILING),), input_surface, SCALE)

    assert actual[0].length_ft == pytest.approx(12.0)
    assert actual[0].area_sqft == pytest.approx(36.0)


def test_user_overrides_win_and_are_flagged():
    input_regions = (
        build_region("wall", RegionLabel.WALL, area_override_sqft=250.0),
        build_region("r", RegionLabel.RAILING, length_override_ft=18.5),
    )
    input_surface = build_surface({"wall": (100, 10, 10), "r": (100, 10, 10)})

    actual = compute_region_areas(input_regions, input_surface, SCALE)

    assert actual[0].area_sqft == 250.0
    assert actual[0].is_override
    assert actual[1].length_ft == 18.5
    assert actual[1].is_override


def test_region_missing_from_measurement_is_zero_not_an_error():
    actual = compute_region_areas(
        (build_region("ghost", RegionLabel.WALL),), build_surface({}), SCALE
    )

    assert actual[0].area_sqft == 0.0


def test_surfaces_are_totalled_by_label():
    input_regions = (
        build_region("w1", RegionLabel.WALL),
        build_region("w2", RegionLabel.WALL),
        build_region("win", RegionLabel.WINDOW),
    )
    input_surface = build_surface(
        {"w1": (5000, 50, 100), "w2": (2500, 25, 100), "win": (1200, 30, 40)}
    )

    actual = summarise_surfaces(compute_region_areas(input_regions, input_surface, SCALE))

    actual_by_label = {total.label: total for total in actual}
    assert actual_by_label[RegionLabel.WALL].count == 2
    assert actual_by_label[RegionLabel.WALL].area_sqft == pytest.approx(75.0)
    assert actual_by_label[RegionLabel.WINDOW].area_sqft == pytest.approx(12.0)
