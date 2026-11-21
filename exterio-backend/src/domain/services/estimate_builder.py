"""Assembles the full estimate from measurements, a design and the rate card."""

from dataclasses import replace

from domain.entities.design_entity import Design
from domain.entities.material_entity import Material
from domain.entities.project_entity import Project
from domain.entities.region_entity import RegionLabel
from domain.entities.scale_reference_entity import ScaleReference
from domain.interfaces.dtos.estimate_dto import EstimateDTO, RegionAreaDTO, ResolvedScaleDTO
from domain.interfaces.dtos.measurement_dto import RectifiedSurface
from domain.services.area_calculator import compute_region_areas, summarise_surfaces
from domain.services.cost_calculator import (
    allocate_to_regions,
    grand_totals,
    price_lines,
    total_by_category,
)
from domain.services.quantity_calculator import build_quantity_lines
from domain.services.scale_resolver import resolve_scale

CURRENCY = "INR"

STANDING_ASSUMPTIONS: tuple[str, ...] = (
    "Areas are measured on the main facade plane after perspective is removed. Surfaces on "
    "other planes (side walls, recessed balconies, front gates) are approximate.",
    "Only what is visible in the photo is counted. Hidden sides of the building are not included.",
    "Window and door openings are subtracted from the wall area.",
    "Wastage is added to the material quantity. Labour is charged on the net quantity.",
    "Rates are indicative defaults in INR and can be edited. GST, scaffolding, surface repair "
    "and transport are not included.",
    "This estimate is advisory and is not a binding quotation.",
)


def build_estimate(
    project: Project,
    design: Design,
    scale_reference: ScaleReference,
    surface: RectifiedSurface,
    materials: dict[str, Material],
) -> EstimateDTO:
    scale = resolve_scale(scale_reference, surface, project.regions)
    areas = compute_region_areas(project.regions, surface, scale)
    quantity_lines = build_quantity_lines(
        areas, design.assignments, materials, project.rate_overrides
    )
    lines = price_lines(quantity_lines, project.rate_overrides)
    return EstimateDTO(
        design_id=design.id,
        currency=CURRENCY,
        scale=scale,
        regions=tuple(
            allocate_to_regions(
                [_with_material(area, design, materials) for area in areas],
                design.assignments,
                materials,
                lines,
            )
        ),
        surfaces=tuple(summarise_surfaces(areas)),
        lines=tuple(lines),
        categories=tuple(total_by_category(lines)),
        totals=grand_totals(lines, scale.confidence_pct),
        assumptions=_assumptions(scale, areas, project.scale is None),
    )


def _with_material(
    area: RegionAreaDTO, design: Design, materials: dict[str, Material]
) -> RegionAreaDTO:
    material = materials.get(design.assignments.get(area.region_id, ""))
    if material is None:
        return area
    return replace(area, material_id=material.id, material_name=material.name)


def _assumptions(
    scale: ResolvedScaleDTO, areas: list[RegionAreaDTO], scale_is_default: bool
) -> tuple[str, ...]:
    notes = [f"{scale.note} Totals carry a band of about ±{scale.confidence_pct:g}%."]
    if scale_is_default:
        notes.append("No scale was set for this photo, so a rough default was used.")
    if any(area.label == RegionLabel.ROOF and not area.is_override for area in areas):
        notes.append(
            "Roofs are measured as they appear in the photo. A sloped roof is larger than it "
            "looks from the front, so type its real area in the breakdown if you know it."
        )
    override_count = sum(1 for area in areas if area.is_override)
    if override_count:
        notes.append(f"{override_count} surface(s) use a measurement you entered by hand.")
    return (*notes, *STANDING_ASSUMPTIONS)
