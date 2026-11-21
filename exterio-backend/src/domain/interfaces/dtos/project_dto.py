from dataclasses import dataclass
from datetime import datetime

from domain.entities.design_entity import RenderStatus
from domain.entities.project_entity import QualityReport, RateOverride
from domain.entities.region_entity import Point, Region, RegionLabel
from domain.entities.scale_reference_entity import ScaleReference


@dataclass(frozen=True)
class RegionInputDTO:
    label: RegionLabel
    name: str
    polygon: tuple[Point, ...]
    id: str | None = None
    source: str | None = None
    surface_multiplier: float = 1.0
    area_override_sqft: float | None = None
    length_override_ft: float | None = None


@dataclass(frozen=True)
class ProjectImageDTO:
    url: str
    width: int
    height: int
    quality: QualityReport


@dataclass(frozen=True)
class DesignDTO:
    id: str
    project_id: str
    name: str
    assignments: dict[str, str]
    preview_url: str | None
    render_url: str | None
    render_status: RenderStatus
    render_error: str | None
    updated_at: datetime


@dataclass(frozen=True)
class ProjectDTO:
    id: str
    name: str
    image: ProjectImageDTO | None
    regions: tuple[Region, ...]
    scale: ScaleReference | None
    designs: tuple[DesignDTO, ...]
    rate_overrides: dict[str, RateOverride]
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class ProjectSummaryDTO:
    id: str
    name: str
    thumbnail_url: str | None
    design_count: int
    # The studio step to carry on at (1 Photo … 5 Estimate), and where the house is, in words.
    progress_step: int
    progress_label: str
    # The latest priced design's grand total; None until a design has a finish.
    estimate_total: float | None
    # The last change to the project or any of its designs.
    updated_at: datetime


@dataclass(frozen=True)
class MaterialDTO:
    id: str
    category: str
    name: str
    description: str
    unit: str
    color_hex: str
    swatch_url: str
    material_rate: float
    labour_rate: float
    wastage_pct: float
    applies_to: tuple[RegionLabel, ...]
    durability: str
    maintenance: str


@dataclass(frozen=True)
class CapabilitiesDTO:
    auto_detect: bool
    photoreal_render: bool
    vision_check: bool
    advisor: bool
