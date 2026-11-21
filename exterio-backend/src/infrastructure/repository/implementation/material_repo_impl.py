"""Material catalogue backed by a JSON seed file.

The catalogue is reference data that ships with the code. Per-project rate
changes are stored on the project as overrides, never written back here.
"""

import json
from pathlib import Path
from typing import Any

from domain.entities.material_entity import (
    Material,
    MaterialCategory,
    MaterialUnit,
    PurchaseRule,
    QuantitySpec,
    TextureSpec,
)
from domain.entities.region_entity import RegionLabel
from domain.interfaces.repos.material_repo import IMaterialRepository

CATALOG_PATH = Path(__file__).resolve().parent.parent / "catalog" / "materials.json"


class JsonMaterialRepository(IMaterialRepository):
    def __init__(self, catalog_path: Path = CATALOG_PATH) -> None:
        rows = json.loads(catalog_path.read_text(encoding="utf-8"))
        self._materials = {row["id"]: self._to_entity(row) for row in rows}

    def find_all(self) -> list[Material]:
        return list(self._materials.values())

    def find_by_id(self, material_id: str) -> Material | None:
        return self._materials.get(material_id)

    @staticmethod
    def _to_entity(row: dict[str, Any]) -> Material:
        quantity, texture = row["quantity"], row["texture"]
        return Material(
            id=row["id"],
            category=MaterialCategory(row["category"]),
            name=row["name"],
            description=row["description"],
            unit=MaterialUnit(row["unit"]),
            color_hex=row["colorHex"],
            material_rate=float(row["materialRate"]),
            labour_rate=float(row["labourRate"]),
            wastage_pct=float(row["wastagePct"]),
            applies_to=tuple(RegionLabel(label) for label in row["appliesTo"]),
            durability=row["durability"],
            maintenance=row["maintenance"],
            quantity=QuantitySpec(
                rule=PurchaseRule(quantity["rule"]),
                purchase_unit=quantity["purchaseUnit"],
                coverage_sqft_per_unit=quantity.get("coverageSqftPerUnit"),
                piece_area_sqft=quantity.get("pieceAreaSqft"),
                consumption_per_sqft=quantity.get("consumptionPerSqft"),
                note=quantity.get("note", ""),
            ),
            texture=TextureSpec(
                pattern=texture["pattern"],
                tile_size_ft=float(texture.get("tileSizeFt", 4)),
                opacity=float(texture.get("opacity", 1)),
                secondary_color_hex=texture.get("secondaryColorHex"),
            ),
        )
