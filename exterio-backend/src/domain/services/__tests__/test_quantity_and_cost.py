import pytest

from domain.entities.material_entity import MaterialCategory, MaterialUnit, PurchaseRule
from domain.entities.region_entity import RegionLabel
from domain.interfaces.dtos.estimate_dto import RegionAreaDTO
from domain.services.__tests__.builders import build_material, build_override
from domain.services.cost_calculator import (
    allocate_to_regions,
    grand_totals,
    price_lines,
    total_by_category,
)
from domain.services.quantity_calculator import build_quantity_lines


def area(region_id: str, area_sqft: float, length_ft: float = 0.0) -> RegionAreaDTO:
    return RegionAreaDTO(region_id, RegionLabel.WALL, region_id, area_sqft, length_ft, False)


def test_paint_litres_are_rounded_up_from_coverage():
    # 1000 sq ft + 5% wastage = 1050 sq ft. At 55 sq ft per litre that is 19.09 -> 20 litres.
    input_materials = {"paint": build_material("paint")}

    actual = build_quantity_lines(
        [area("w1", 600.0), area("w2", 400.0)], {"w1": "paint", "w2": "paint"}, input_materials, {}
    )

    assert len(actual) == 1
    assert actual[0].net_quantity == 1000.0
    assert actual[0].gross_quantity == 1050.0
    assert actual[0].purchase_quantity == 20.0


def test_tile_count_is_rounded_up_to_whole_tiles():
    # 100 sq ft + 10% = 110 sq ft. A 2 ft x 2 ft tile covers 4 sq ft -> 27.5 -> 28 tiles.
    input_materials = {"tile": build_material("tile", rule=PurchaseRule.PIECE, wastage_pct=10.0)}

    actual = build_quantity_lines([area("w1", 100.0)], {"w1": "tile"}, input_materials, {})

    assert actual[0].purchase_quantity == 28.0


def test_railing_uses_running_feet_not_area():
    input_materials = {
        "rail": build_material(
            "rail", unit=MaterialUnit.RFT, rule=PurchaseRule.LENGTH, wastage_pct=0.0
        )
    }

    actual = build_quantity_lines([area("r1", 36.0, 12.0)], {"r1": "rail"}, input_materials, {})

    assert actual[0].net_quantity == 12.0


def test_unassigned_and_unknown_materials_are_ignored():
    actual = build_quantity_lines(
        [area("w1", 100.0), area("w2", 50.0)], {"w2": "missing"}, {"paint": build_material()}, {}
    )

    assert actual == []


def test_wastage_override_replaces_the_default():
    input_overrides = {"paint": build_override(wastage_pct=20.0)}

    actual = build_quantity_lines(
        [area("w1", 100.0)], {"w1": "paint"}, {"paint": build_material()}, input_overrides
    )

    assert actual[0].gross_quantity == 120.0


def test_material_is_charged_on_gross_and_labour_on_net():
    input_lines = build_quantity_lines(
        [area("w1", 1000.0)], {"w1": "paint"}, {"paint": build_material()}, {}
    )

    actual = price_lines(input_lines, {})

    assert actual[0].material_cost == pytest.approx(1050.0 * 14.0)
    assert actual[0].labour_cost == pytest.approx(1000.0 * 12.0)
    assert actual[0].total == pytest.approx(14700.0 + 12000.0)


def test_rate_override_recalculates_cost():
    input_lines = build_quantity_lines(
        [area("w1", 100.0)], {"w1": "paint"}, {"paint": build_material(wastage_pct=0.0)}, {}
    )
    input_overrides = {"paint": build_override(material_rate=20.0, labour_rate=5.0)}

    actual = price_lines(input_lines, input_overrides)

    assert actual[0].material_cost == 2000.0
    assert actual[0].labour_cost == 500.0


def test_totals_by_category_and_grand_total_with_band():
    input_materials = {
        "paint": build_material("paint", wastage_pct=0.0),
        "stone": build_material(
            "stone",
            category=MaterialCategory.STONE,
            rule=PurchaseRule.AREA,
            wastage_pct=0.0,
            material_rate=220.0,
            labour_rate=80.0,
        ),
    }
    input_lines = build_quantity_lines(
        [area("w1", 100.0), area("w2", 10.0)],
        {"w1": "paint", "w2": "stone"},
        input_materials,
        {},
    )
    priced = price_lines(input_lines, {})

    actual_categories = {total.category: total for total in total_by_category(priced)}
    actual_totals = grand_totals(priced, confidence_pct=10.0)

    assert actual_categories[MaterialCategory.PAINT].total == 2600.0
    assert actual_categories[MaterialCategory.STONE].total == 3000.0
    assert actual_totals.material_cost == 1400.0 + 2200.0
    assert actual_totals.labour_cost == 1200.0 + 800.0
    assert actual_totals.grand_total == 5600.0
    assert actual_totals.low_estimate == 5040.0
    assert actual_totals.high_estimate == 6160.0


def _priced(areas, assignments, materials):
    lines = price_lines(build_quantity_lines(areas, assignments, materials, {}), {})
    return lines, allocate_to_regions(areas, assignments, materials, lines)


def test_each_part_gets_its_share_of_the_material_line():
    input_materials = {"paint": build_material("paint")}
    input_areas = [area("w1", 300.0), area("w2", 100.0)]

    lines, actual = _priced(input_areas, {"w1": "paint", "w2": "paint"}, input_materials)

    by_id = {item.region_id: item for item in actual}
    assert by_id["w1"].total_cost == pytest.approx(lines[0].total * 0.75, abs=0.01)
    assert by_id["w2"].total_cost == pytest.approx(lines[0].total * 0.25, abs=0.01)
    assert by_id["w1"].material_cost + by_id["w1"].labour_cost == pytest.approx(
        by_id["w1"].total_cost, abs=0.02
    )


def test_running_feet_materials_are_shared_by_length():
    railing = build_material("rail", unit=MaterialUnit.RFT, rule=PurchaseRule.LENGTH)
    input_areas = [area("r1", 50.0, length_ft=10.0), area("r2", 5.0, length_ft=30.0)]

    lines, actual = _priced(input_areas, {"r1": "rail", "r2": "rail"}, {"rail": railing})

    by_id = {item.region_id: item for item in actual}
    assert by_id["r2"].total_cost == pytest.approx(lines[0].total * 0.75, abs=0.01)


def test_parts_without_a_finish_cost_nothing():
    _, actual = _priced(
        [area("w1", 100.0), area("window", 20.0)], {"w1": "paint"}, {"paint": build_material()}
    )

    window = next(item for item in actual if item.region_id == "window")
    assert (window.material_cost, window.labour_cost, window.total_cost) == (0.0, 0.0, 0.0)


def test_parts_add_up_to_the_grand_total():
    input_materials = {"paint": build_material("paint"), "stone": build_material("stone")}
    input_areas = [area("w1", 237.0), area("w2", 91.5), area("p1", 33.3), area("p2", 36.7)]
    assignments = {"w1": "paint", "w2": "paint", "p1": "stone", "p2": "stone"}

    lines, actual = _priced(input_areas, assignments, input_materials)

    total = grand_totals(lines, 10.0).grand_total
    assert sum(item.total_cost for item in actual) == pytest.approx(total, abs=0.05)
