"""Contracts for everything that touches pixels. Implemented with OpenCV in infrastructure."""

from abc import ABC, abstractmethod
from collections.abc import Iterator
from dataclasses import dataclass
from enum import StrEnum

from domain.entities.material_entity import Material
from domain.entities.project_entity import QualityIssue, QualityReport
from domain.entities.region_entity import Point, Region, RegionLabel
from domain.entities.scale_reference_entity import ScaleReference
from domain.interfaces.dtos.measurement_dto import RectifiedSurface


@dataclass(frozen=True)
class PreparedImage:
    """An upload after orientation fix and resize, with its quality report."""

    data: bytes
    width: int
    height: int
    report: QualityReport


@dataclass(frozen=True)
class DetectedRegion:
    label: RegionLabel
    polygon: tuple[Point, ...]
    score: float
    # The detector's own name for the part. Used for `other` parts, which have no stock name.
    name: str | None = None


@dataclass(frozen=True)
class VisionVerdict:
    issues: tuple[QualityIssue, ...]
    guidance: tuple[str, ...]


@dataclass(frozen=True)
class PreviewRequest:
    image: bytes
    regions: tuple[Region, ...]
    materials_by_region: dict[str, Material]
    facade_corners: tuple[Point, Point, Point, Point]
    facade_width_ft: float
    facade_height_ft: float


class IImageInspectionService(ABC):
    @abstractmethod
    def prepare(self, raw: bytes) -> PreparedImage:
        """Normalise an upload and score its quality. Raises UnreadableImageError."""

    @abstractmethod
    def thumbnail(self, image: bytes, max_side: int) -> bytes: ...

    @abstractmethod
    def max_upload_mb(self) -> int: ...


class IVisionCheckService(ABC):
    """Optional vision-LLM check that the photo really is a usable house exterior."""

    @abstractmethod
    def is_available(self) -> bool: ...

    @abstractmethod
    def check(self, image: bytes) -> VisionVerdict: ...


class ISegmentationService(ABC):
    @abstractmethod
    def is_available(self) -> bool: ...

    @abstractmethod
    def detect(self, image: bytes, width: int, height: int) -> list[DetectedRegion]: ...

    def detect_stream(self, image: bytes, width: int, height: int) -> Iterator[DetectedRegion]:
        """Each region as soon as the provider has it. Providers that answer in one go give all
        of them together at the end."""
        yield from self.detect(image, width, height)


class ISurfaceMeasurementService(ABC):
    @abstractmethod
    def measure(
        self,
        width: int,
        height: int,
        regions: tuple[Region, ...],
        facade_corners: tuple[Point, Point, Point, Point],
        reference_line: tuple[Point, Point] | None,
        known_aspect_ratio: float | None,
    ) -> RectifiedSurface:
        """Remove perspective and return each region's size in rectified pixels."""


class IPreviewRenderService(ABC):
    @abstractmethod
    def render(self, request: PreviewRequest) -> bytes:
        """Composite the chosen materials onto the photo, keeping its shading."""

    @abstractmethod
    def merge_with_original(
        self,
        original: bytes,
        edited: bytes,
        regions: tuple[Region, ...],
        edited_ids: frozenset[str],
    ) -> bytes:
        """Keep edited pixels inside the given regions and original pixels elsewhere."""

    @abstractmethod
    def swatch(self, material: Material, size: int) -> bytes: ...


@dataclass(frozen=True)
class RenderFinish:
    """One finish to make look real: which surface, and the material on it."""

    surface: str
    material: str
    description: str


class IPhotorealRenderService(ABC):
    """Turns the instant preview into a realistic image. Each implementation writes the prompt
    its own model understands, from the finishes applied."""

    @abstractmethod
    def is_available(self) -> bool: ...

    @abstractmethod
    def daily_limit(self) -> int: ...

    @abstractmethod
    def render(self, composite: bytes, finishes: tuple[RenderFinish, ...]) -> bytes: ...


class SampleStage(StrEnum):
    """How far along a sample house is created, so the samples show every step between them."""

    PHOTO = "photo"  # the photo alone: its parts are found with Auto-detect
    PARTS = "parts"  # parts marked, no finishes chosen yet
    DESIGNED = "designed"  # a finished design, real size not yet given (a rough estimate)
    FINISHED = "finished"  # a finished design, its real size and its estimate


@dataclass(frozen=True)
class SampleHouse:
    name: str
    design_name: str
    image: bytes
    regions: tuple[Region, ...]
    scale: ScaleReference
    # The finished design: region id -> material id.
    assignments: dict[str, str]
    stage: SampleStage = SampleStage.FINISHED


@dataclass(frozen=True)
class SampleHouseSummary:
    key: str
    name: str


class ISampleHouseProvider(ABC):
    """Supplies the ready-made demo houses used by "Try it with a sample house"."""

    @abstractmethod
    def samples(self) -> tuple[SampleHouseSummary, ...]:
        """Every sample, in the order they are offered; the first is the default."""

    @abstractmethod
    def build(self, key: str | None = None) -> SampleHouse:
        """The sample with this key, or the first one."""
