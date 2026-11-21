"""Material entity: a catalogue item with its rates and quantity rules."""

from dataclasses import dataclass
from enum import StrEnum

from domain.entities.region_entity import RegionLabel


class MaterialCategory(StrEnum):
    PAINT = "paint"
    TEXTURE = "texture"
    STONE = "stone"
    TILE = "tile"
    PANEL = "panel"
    GLASS_RAILING = "glass_railing"
    METAL_RAILING = "metal_railing"


class MaterialUnit(StrEnum):
    SQFT = "sqft"
    RFT = "rft"


class PurchaseRule(StrEnum):
    """How the gross quantity is converted into something a shop sells."""

    COVERAGE = "coverage"  # litres, from coverage per litre
    WEIGHT = "weight"  # kilograms, from consumption per sq ft
    PIECE = "piece"  # whole tiles or sheets, rounded up
    AREA = "area"  # sold by the square foot
    LENGTH = "length"  # sold by the running foot


@dataclass(frozen=True)
class QuantitySpec:
    rule: PurchaseRule
    purchase_unit: str
    coverage_sqft_per_unit: float | None = None
    piece_area_sqft: float | None = None
    consumption_per_sqft: float | None = None
    note: str = ""


@dataclass(frozen=True)
class TextureSpec:
    """Describes how the instant preview paints this material."""

    pattern: str
    tile_size_ft: float = 4.0
    opacity: float = 1.0
    secondary_color_hex: str | None = None


@dataclass(frozen=True)
class Material:
    id: str
    category: MaterialCategory
    name: str
    description: str
    unit: MaterialUnit
    color_hex: str
    material_rate: float
    labour_rate: float
    wastage_pct: float
    applies_to: tuple[RegionLabel, ...]
    durability: str
    maintenance: str
    quantity: QuantitySpec
    texture: TextureSpec

    def can_apply_to(self, label: RegionLabel) -> bool:
        return label in self.applies_to
