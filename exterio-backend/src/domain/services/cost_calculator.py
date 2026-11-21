"""Prices quantity lines and rolls them up into category and grand totals.

Material is charged on the gross quantity (wastage has to be bought).
Labour is charged on the net quantity (nobody is paid to install offcuts).
"""

from domain.entities.project_entity import RateOverride
from domain.interfaces.dtos.estimate_dto import (
    CategoryTotalDTO,
    EstimateLineDTO,
    EstimateTotalsDTO,
)
from domain.services.quantity_calculator import PERCENT, QuantityLine

MONEY_DECIMALS = 2


def price_lines(
    lines: list[QuantityLine], overrides: dict[str, RateOverride]
) -> list[EstimateLineDTO]:
    return [_price_line(line, overrides.get(line.material.id)) for line in lines]


def _price_line(line: QuantityLine, override: RateOverride | None) -> EstimateLineDTO:
    material = line.material
    material_rate = material.material_rate
    labour_rate = material.labour_rate
    if override is not None:
        if override.material_rate is not None:
            material_rate = override.material_rate
        if override.labour_rate is not None:
            labour_rate = override.labour_rate

    material_cost = round(line.gross_quantity * material_rate, MONEY_DECIMALS)
    labour_cost = round(line.net_quantity * labour_rate, MONEY_DECIMALS)
    return EstimateLineDTO(
        material_id=material.id,
        material_name=material.name,
        category=material.category,
        unit=material.unit,
        net_quantity=line.net_quantity,
        wastage_pct=line.wastage_pct,
        gross_quantity=line.gross_quantity,
        purchase_quantity=line.purchase_quantity,
        purchase_unit=material.quantity.purchase_unit,
        purchase_note=line.purchase_note,
        material_rate=material_rate,
        labour_rate=labour_rate,
        material_cost=material_cost,
        labour_cost=labour_cost,
        total=round(material_cost + labour_cost, MONEY_DECIMALS),
    )


def total_by_category(lines: list[EstimateLineDTO]) -> list[CategoryTotalDTO]:
    totals: dict[str, CategoryTotalDTO] = {}
    for line in lines:
        current = totals.get(line.category)
        material_cost = (current.material_cost if current else 0.0) + line.material_cost
        labour_cost = (current.labour_cost if current else 0.0) + line.labour_cost
        totals[line.category] = CategoryTotalDTO(
            category=line.category,
            material_cost=round(material_cost, MONEY_DECIMALS),
            labour_cost=round(labour_cost, MONEY_DECIMALS),
            total=round(material_cost + labour_cost, MONEY_DECIMALS),
        )
    return list(totals.values())


def grand_totals(lines: list[EstimateLineDTO], confidence_pct: float) -> EstimateTotalsDTO:
    material_cost = round(sum(line.material_cost for line in lines), MONEY_DECIMALS)
    labour_cost = round(sum(line.labour_cost for line in lines), MONEY_DECIMALS)
    grand_total = round(material_cost + labour_cost, MONEY_DECIMALS)
    band = confidence_pct / PERCENT
    return EstimateTotalsDTO(
        material_cost=material_cost,
        labour_cost=labour_cost,
        grand_total=grand_total,
        low_estimate=round(grand_total * (1 - band), MONEY_DECIMALS),
        high_estimate=round(grand_total * (1 + band), MONEY_DECIMALS),
    )
