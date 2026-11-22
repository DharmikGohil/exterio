from datetime import datetime
from typing import Annotated

from pydantic import Field

from domain.entities.design_entity import RenderStatus
from domain.entities.material_entity import MaterialCategory, MaterialUnit
from domain.entities.project_entity import IssueSeverity
from domain.entities.region_entity import RegionLabel, RegionSource
from domain.entities.scale_reference_entity import DEFAULT_DOOR_HEIGHT_FT, ScaleMethod
from presentation.schemas.base_schema import CamelModel, Point

Polygon = Annotated[list[Point], Field(min_length=3, max_length=400)]
PositiveFeet = Annotated[float, Field(gt=0, le=2000)]


class QualityIssueSchema(CamelModel):
    code: str
    severity: IssueSeverity
    message: str


class QualityMetricsSchema(CamelModel):
    width: int
    height: int
    blur_score: float
    brightness: float


class QualityReportSchema(CamelModel):
    usable: bool
    score: int
    issues: list[QualityIssueSchema]
    guidance: list[str]
    metrics: QualityMetricsSchema


class ProjectImageResponse(CamelModel):
    url: str
    width: int
    height: int
    quality: QualityReportSchema


class RegionResponse(CamelModel):
    id: str
    label: RegionLabel
    name: str
    polygon: list[Point]
    source: RegionSource
    surface_multiplier: float
    area_override_sqft: float | None
    length_override_ft: float | None


class RegionInput(CamelModel):
    id: str | None = None
    label: RegionLabel
    name: str = Field(min_length=1, max_length=60)
    polygon: Polygon
    source: RegionSource | None = None
    surface_multiplier: float = Field(default=1.0, gt=0, le=10)
    area_override_sqft: float | None = Field(default=None, ge=0, le=1_000_000)
    length_override_ft: float | None = Field(default=None, ge=0, le=100_000)


class ReplaceRegionsRequest(CamelModel):
    regions: list[RegionInput] = Field(max_length=200)


class ScaleReferenceSchema(CamelModel):
    method: ScaleMethod
    facade_corners: Annotated[list[Point], Field(min_length=4, max_length=4)]
    reference_line: Annotated[list[Point], Field(min_length=2, max_length=2)] | None = None
    reference_length_ft: PositiveFeet | None = None
    facade_width_ft: PositiveFeet | None = None
    facade_height_ft: PositiveFeet | None = None
    storeys: int = Field(default=1, ge=1, le=10)
    door_height_ft: PositiveFeet = DEFAULT_DOOR_HEIGHT_FT


class RateOverrideSchema(CamelModel):
    material_rate: float | None = Field(default=None, ge=0, le=10_000_000)
    labour_rate: float | None = Field(default=None, ge=0, le=10_000_000)
    wastage_pct: float | None = Field(default=None, ge=0, le=100)


class UpdateRatesRequest(CamelModel):
    overrides: dict[str, RateOverrideSchema]


class DesignResponse(CamelModel):
    id: str
    project_id: str
    name: str
    assignments: dict[str, str]
    preview_url: str | None
    render_url: str | None
    render_status: RenderStatus
    render_error: str | None
    updated_at: datetime


class ProjectResponse(CamelModel):
    id: str
    name: str
    image: ProjectImageResponse | None
    regions: list[RegionResponse]
    scale: ScaleReferenceSchema | None
    designs: list[DesignResponse]
    rate_overrides: dict[str, RateOverrideSchema]
    created_at: datetime
    updated_at: datetime


class ProjectSummaryResponse(CamelModel):
    id: str
    name: str
    thumbnail_url: str | None
    design_count: int
    progress_step: int = Field(ge=1, le=5)
    progress_label: str
    estimate_total: float | None
    updated_at: datetime


class ProjectNameRequest(CamelModel):
    name: str = Field(default="", max_length=80)


class CreateDesignRequest(CamelModel):
    name: str = Field(default="", max_length=60)
    copy_from_design_id: str | None = None


class UpdateDesignRequest(CamelModel):
    name: str | None = Field(default=None, max_length=60)
    assignments: dict[str, str] | None = None


class MaterialResponse(CamelModel):
    id: str
    category: MaterialCategory
    name: str
    description: str
    unit: MaterialUnit
    color_hex: str
    swatch_url: str
    material_rate: float
    labour_rate: float
    wastage_pct: float
    applies_to: list[RegionLabel]
    durability: str
    maintenance: str


class CapabilitiesResponse(CamelModel):
    auto_detect: bool
    photoreal_render: bool
    vision_check: bool
    advisor: bool
