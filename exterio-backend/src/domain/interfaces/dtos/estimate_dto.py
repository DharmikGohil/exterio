from dataclasses import dataclass

from domain.entities.material_entity import MaterialCategory, MaterialUnit
from domain.entities.region_entity import RegionLabel
from domain.entities.scale_reference_entity import ScaleMethod


@dataclass(frozen=True)
class ResolvedScaleDTO:
    method: ScaleMethod
    feet_per_pixel_x: float
    feet_per_pixel_y: float
    confidence_pct: float
    note: str


@dataclass(frozen=True)
class RegionAreaDTO:
    region_id: str
    label: RegionLabel
    name: str
    area_sqft: float
    length_ft: float
    is_override: bool
    material_id: str | None = None
    material_name: str | None = None
    # This part's share of its material line (zero when it has no finish).
    material_cost: float = 0.0
    labour_cost: float = 0.0
    total_cost: float = 0.0


@dataclass(frozen=True)
class SurfaceTotalDTO:
    label: RegionLabel
    count: int
    area_sqft: float
    length_ft: float


@dataclass(frozen=True)
class EstimateLineDTO:
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


@dataclass(frozen=True)
class CategoryTotalDTO:
    category: MaterialCategory
    material_cost: float
    labour_cost: float
    total: float


@dataclass(frozen=True)
class EstimateTotalsDTO:
    material_cost: float
    labour_cost: float
    grand_total: float
    low_estimate: float
    high_estimate: float


@dataclass(frozen=True)
class EstimateDTO:
    design_id: str
    currency: str
    scale: ResolvedScaleDTO
    regions: tuple[RegionAreaDTO, ...]
    surfaces: tuple[SurfaceTotalDTO, ...]
    lines: tuple[EstimateLineDTO, ...]
    categories: tuple[CategoryTotalDTO, ...]
    totals: EstimateTotalsDTO
    assumptions: tuple[str, ...]
