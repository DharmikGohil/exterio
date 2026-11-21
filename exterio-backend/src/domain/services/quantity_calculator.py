"""Material quantities: net measure, wastage, and what has to be bought."""

import math
from dataclasses import dataclass

from domain.entities.material_entity import Material, MaterialUnit, PurchaseRule
from domain.entities.project_entity import RateOverride
from domain.interfaces.dtos.estimate_dto import RegionAreaDTO

PERCENT = 100.0
QUANTITY_DECIMALS = 2


@dataclass(frozen=True)
class QuantityLine:
    material: Material
    net_quantity: float
    wastage_pct: float
    gross_quantity: float
    purchase_quantity: float
    purchase_note: str


def build_quantity_lines(
    areas: list[RegionAreaDTO],
    assignments: dict[str, str],
    materials: dict[str, Material],
    overrides: dict[str, RateOverride],
) -> list[QuantityLine]:
    net_by_material: dict[str, float] = {}
    for area in areas:
        material = materials.get(assignments.get(area.region_id, ""))
        if material is None:
            continue
        measure = area.length_ft if material.unit == MaterialUnit.RFT else area.area_sqft
        net_by_material[material.id] = net_by_material.get(material.id, 0.0) + measure

    return [
        _quantity_line(materials[material_id], net, overrides.get(material_id))
        for material_id, net in net_by_material.items()
    ]


def _quantity_line(material: Material, net: float, override: RateOverride | None) -> QuantityLine:
    wastage_pct = material.wastage_pct
    if override is not None and override.wastage_pct is not None:
        wastage_pct = override.wastage_pct
    gross = net * (1 + wastage_pct / PERCENT)
    purchase_quantity, purchase_note = _purchase(material, gross)
    return QuantityLine(
        material=material,
        net_quantity=round(net, QUANTITY_DECIMALS),
        wastage_pct=wastage_pct,
        gross_quantity=round(gross, QUANTITY_DECIMALS),
        purchase_quantity=purchase_quantity,
        purchase_note=purchase_note,
    )


def _purchase(material: Material, gross: float) -> tuple[float, str]:
    spec = material.quantity
    if spec.rule == PurchaseRule.COVERAGE and spec.coverage_sqft_per_unit:
        quantity = math.ceil(gross / spec.coverage_sqft_per_unit)
        note = spec.note or f"{spec.coverage_sqft_per_unit:g} sq ft per {spec.purchase_unit}"
        return float(quantity), note
    if spec.rule == PurchaseRule.WEIGHT and spec.consumption_per_sqft:
        quantity = math.ceil(gross * spec.consumption_per_sqft)
        note = spec.note or f"{spec.consumption_per_sqft:g} {spec.purchase_unit} per sq ft"
        return float(quantity), note
    if spec.rule == PurchaseRule.PIECE and spec.piece_area_sqft:
        quantity = math.ceil(gross / spec.piece_area_sqft)
        note = spec.note or f"{spec.piece_area_sqft:g} sq ft per {spec.purchase_unit}"
        return float(quantity), note
    return float(math.ceil(gross)), spec.note
