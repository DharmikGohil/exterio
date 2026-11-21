from domain.entities.material_entity import MaterialCategory, MaterialUnit
from domain.entities.region_entity import RegionLabel
from domain.entities.scale_reference_entity import ScaleMethod
from presentation.schemas.base_schema import CamelModel


class ResolvedScaleSchema(CamelModel):
    method: ScaleMethod
    feet_per_pixel_x: float
    feet_per_pixel_y: float
    confidence_pct: float
    note: str


class RegionAreaSchema(CamelModel):
    region_id: str
    label: RegionLabel
    name: str
    area_sqft: float
    length_ft: float
    is_override: bool
    material_id: str | None
    material_name: str | None


class SurfaceTotalSchema(CamelModel):
    label: RegionLabel
    count: int
    area_sqft: float
    length_ft: float


class EstimateLineSchema(CamelModel):
    material_id: str
    material_name: str
    category: MaterialCategory
    unit: MaterialUnit
    net_quantity: float
    wastage_pct: float
    gross_quantity: float
    purchase_quantity: float
    purchase_unit: str
    purchase_note: str
    material_rate: float
    labour_rate: float
    material_cost: float
    labour_cost: float
    total: float


class CategoryTotalSchema(CamelModel):
    category: MaterialCategory
    material_cost: float
    labour_cost: float
    total: float


class EstimateTotalsSchema(CamelModel):
    material_cost: float
    labour_cost: float
    grand_total: float
    low_estimate: float
    high_estimate: float


class EstimateResponse(CamelModel):
    design_id: str
    currency: str
    scale: ResolvedScaleSchema
    regions: list[RegionAreaSchema]
    surfaces: list[SurfaceTotalSchema]
    lines: list[EstimateLineSchema]
    categories: list[CategoryTotalSchema]
    totals: EstimateTotalsSchema
    assumptions: list[str]
