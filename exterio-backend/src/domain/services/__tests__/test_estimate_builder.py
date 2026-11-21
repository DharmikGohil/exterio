import pytest

from domain.entities.region_entity import RegionLabel
from domain.services.__tests__.builders import (
    build_design,
    build_material,
    build_project,
    build_region,
    build_scale,
    build_surface,
)
from domain.services.estimate_builder import build_estimate


def test_end_to_end_estimate_for_a_wall_with_a_window():
    # 10 ft x 10 ft facade at 10 px per ft, one 3 ft x 4 ft window, paint on the wall.
    input_regions = (
        build_region("wall", RegionLabel.WALL),
        build_region("win", RegionLabel.WINDOW),
    )
    input_project = build_project(input_regions, scale=build_scale())
    input_surface = build_surface({"wall": (8800, 100, 100), "win": (1200, 30, 40)})
    input_design = build_design({"wall": "paint"})

    actual = build_estimate(
        input_project, input_design, build_scale(), input_surface, {"paint": build_material()}
    )

    assert actual.regions[0].area_sqft == pytest.approx(88.0)
    assert actual.regions[0].material_name == "Paint"
    assert actual.regions[1].material_id is None
    assert actual.lines[0].gross_quantity == pytest.approx(92.4)
    assert actual.lines[0].purchase_quantity == 2.0
    assert actual.totals.grand_total == pytest.approx(92.4 * 14.0 + 88.0 * 12.0)
    assert actual.currency == "INR"


def test_default_scale_and_overrides_are_called_out_in_assumptions():
    input_regions = (build_region("wall", RegionLabel.WALL, area_override_sqft=500.0),)
    input_project = build_project(input_regions, scale=None)

    actual = build_estimate(input_project, build_design({}), build_scale(), build_surface({}), {})

    actual_text = " ".join(actual.assumptions)
    assert "rough default" in actual_text
    assert "1 surface(s) use a measurement you entered" in actual_text
    assert actual.totals.grand_total == 0.0
