"""Project aggregate: one house photo with its regions, scale and rate overrides."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum

from domain.entities.region_entity import Region
from domain.entities.scale_reference_entity import ScaleReference


class IssueSeverity(StrEnum):
    ERROR = "error"
    WARNING = "warning"


@dataclass(frozen=True)
class QualityIssue:
    code: str
    severity: IssueSeverity
    message: str


@dataclass(frozen=True)
class QualityMetrics:
    width: int
    height: int
    blur_score: float
    brightness: float


@dataclass(frozen=True)
class QualityReport:
    usable: bool
    score: int
    issues: tuple[QualityIssue, ...]
    guidance: tuple[str, ...]
    metrics: QualityMetrics


@dataclass(frozen=True)
class ProjectImage:
    path: str
    width: int
    height: int
    quality: QualityReport


@dataclass(frozen=True)
class RateOverride:
    material_rate: float | None = None
    labour_rate: float | None = None
    wastage_pct: float | None = None


@dataclass(frozen=True)
class Project:
    id: str
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime
    image: ProjectImage | None = None
    regions: tuple[Region, ...] = ()
    scale: ScaleReference | None = None
    rate_overrides: dict[str, RateOverride] = field(default_factory=dict)

    def region_ids(self) -> frozenset[str]:
        return frozenset(region.id for region in self.regions)
