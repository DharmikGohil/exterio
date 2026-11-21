"""Test data builders shared by the domain unit tests."""

from datetime import UTC, datetime

from domain.entities.design_entity import Design
from domain.entities.material_entity import (
    Material,
    MaterialCategory,
    MaterialUnit,
    PurchaseRule,
    QuantitySpec,
    TextureSpec,
)
from domain.entities.project_entity import Project, RateOverride
from domain.entities.region_entity import Region, RegionLabel
from domain.entities.scale_reference_entity import ScaleMethod, ScaleReference
from domain.interfaces.dtos.measurement_dto import RectifiedSurface, RegionPixels

NOW = datetime(2026, 11, 21, tzinfo=UTC)
SQUARE = ((0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0))
CORNERS = ((0.0, 0.0), (100.0, 0.0), (100.0, 100.0), (0.0, 100.0))


def build_region(region_id: str, label: RegionLabel, **overrides) -> Region:
    return Region(id=region_id, label=label, name=region_id, polygon=SQUARE, **overrides)


def build_surface(pixels: dict[str, tuple[float, float, float]], **overrides) -> RectifiedSurface:
    """pixels maps region id -> (area_px, width_px, height_px)."""
    fields = {
        "facade_width_px": 100.0,
        "facade_height_px": 100.0,
        "region_pixels": {key: RegionPixels(*value) for key, value in pixels.items()},
        **overrides,
    }
    return RectifiedSurface(**fields)


def build_scale(method: ScaleMethod = ScaleMethod.FACADE_DIMENSIONS, **overrides) -> ScaleReference:
    fields = {
        "method": method,
        "facade_corners": CORNERS,
        "facade_width_ft": 10.0,
        "facade_height_ft": 10.0,
        **overrides,
    }
    return ScaleReference(**fields)


def build_material(
    material_id: str = "paint",
    unit: MaterialUnit = MaterialUnit.SQFT,
    rule: PurchaseRule = PurchaseRule.COVERAGE,
    **overrides,
) -> Material:
    fields = {
        "id": material_id,
        "category": MaterialCategory.PAINT,
        "name": material_id.title(),
        "description": "",
        "unit": unit,
        "color_hex": "#ffffff",
        "material_rate": 14.0,
        "labour_rate": 12.0,
        "wastage_pct": 5.0,
        "applies_to": (RegionLabel.WALL,),
        "durability": "",
        "maintenance": "",
        "quantity": QuantitySpec(
            rule=rule,
            purchase_unit="litre",
            coverage_sqft_per_unit=55.0,
            piece_area_sqft=4.0,
            consumption_per_sqft=0.25,
        ),
        "texture": TextureSpec(pattern="flat"),
        **overrides,
    }
    return Material(**fields)


def build_project(regions: tuple[Region, ...], **overrides) -> Project:
    fields = {
        "id": "project-1",
        "user_id": "user-1",
        "name": "Test house",
        "created_at": NOW,
        "updated_at": NOW,
        "regions": regions,
        **overrides,
    }
    return Project(**fields)


def build_design(assignments: dict[str, str]) -> Design:
    return Design(
        id="design-1",
        project_id="project-1",
        name="Design 1",
        created_at=NOW,
        updated_at=NOW,
        assignments=assignments,
    )


def build_override(**fields) -> RateOverride:
    return RateOverride(**fields)
