from collections.abc import Iterator
from dataclasses import dataclass, replace
from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.project_entity import Project
from domain.entities.region_entity import MIN_POLYGON_POINTS, Region, RegionLabel, RegionSource
from domain.errors.project_errors import AiNotConfiguredError, AiProviderError, ImageRequiredError
from domain.interfaces.dtos.project_dto import ProjectDTO
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.interfaces.services.image_services import DetectedRegion, ISegmentationService
from domain.services.project_access import get_owned_project
from domain.use_cases.project.project_reader import ProjectReader
from domain.use_cases.project.project_refresher import ProjectRefresher

# A free-standing or porch pillar usually shows one face of three that need finishing.
DEFAULT_MULTIPLIERS: dict[RegionLabel, float] = {RegionLabel.PILLAR: 3.0}
MAX_NAME_LENGTH = 40


@dataclass(frozen=True)
class RegionFoundEvent:
    """One part, as soon as the detector has it. Not saved yet."""

    region: Region


@dataclass(frozen=True)
class DetectionDoneEvent:
    """Every part was found and the project was saved with them."""

    project: ProjectDTO


@dataclass(frozen=True)
class DetectionFailedEvent:
    """Detection failed part way; nothing was saved."""

    message: str


DetectionEvent = RegionFoundEvent | DetectionDoneEvent | DetectionFailedEvent


class DetectRegionsUseCase:
    """Runs AI segmentation and replaces previously detected regions.

    Regions the user drew or corrected by hand are kept.
    """

    def __init__(
        self,
        project_repo: IProjectRepository,
        storage: IFileStorageService,
        segmentation: ISegmentationService,
        reader: ProjectReader,
        refresher: ProjectRefresher,
    ) -> None:
        self._project_repo = project_repo
        self._storage = storage
        self._segmentation = segmentation
        self._reader = reader
        self._refresher = refresher

    def execute(self, project_id: str, user_id: str) -> ProjectDTO:
        for event in self.stream(project_id, user_id):
            if isinstance(event, DetectionFailedEvent):
                raise AiProviderError(event.message)
            if isinstance(event, DetectionDoneEvent):
                return event.project
        raise AiProviderError("Region detection failed. Try again.")

    def stream(self, project_id: str, user_id: str) -> Iterator[DetectionEvent]:
        """Checks access now, so a refusal is an ordinary error; detection runs as the events
        are read. Each part is reported the moment the detector has it, and the project is saved
        once, with all of them, at the end, so a failure part way changes nothing."""
        project = get_owned_project(self._project_repo, project_id, user_id)
        if project.image is None:
            raise ImageRequiredError
        if not self._segmentation.is_available():
            raise AiNotConfiguredError("Automatic region detection")
        return self._detect(project)

    def _detect(self, project: Project) -> Iterator[DetectionEvent]:
        assert project.image is not None
        kept = tuple(region for region in project.regions if region.source == RegionSource.USER)
        namer = _RegionNamer(kept)
        found: list[Region] = []
        try:
            for item in self._segmentation.detect_stream(
                self._storage.read(project.image.path), project.image.width, project.image.height
            ):
                region = namer.name(item)
                if region is not None:
                    found.append(region)
                    yield RegionFoundEvent(region)
        except AiProviderError as error:
            yield DetectionFailedEvent(str(error))
            return

        updated = self._project_repo.update(
            replace(project, regions=(*kept, *found), updated_at=datetime.now(UTC))
        )
        self._refresher.refresh_designs(updated)
        yield DetectionDoneEvent(self._reader.to_dto(updated))


class _RegionNamer:
    """Numbers parts per kind as they arrive ("Window 1", "Window 2"), after the kept ones."""

    def __init__(self, kept: tuple[Region, ...]) -> None:
        self._counters: dict[RegionLabel, int] = {}
        for region in kept:
            self._counters[region.label] = self._counters.get(region.label, 0) + 1

    def name(self, item: DetectedRegion) -> Region | None:
        if len(item.polygon) < MIN_POLYGON_POINTS:
            return None
        self._counters[item.label] = self._counters.get(item.label, 0) + 1
        return Region(
            id=str(uuid4()),
            label=item.label,
            name=_region_name(item, self._counters[item.label]),
            polygon=item.polygon,
            source=RegionSource.AUTO,
            surface_multiplier=DEFAULT_MULTIPLIERS.get(item.label, 1.0),
        )


def _region_name(item: DetectedRegion, number: int) -> str:
    """Stock parts are numbered ("Window 2"); an `other` part keeps the detector's own name."""
    if item.label == RegionLabel.OTHER:
        name = " ".join((item.name or "").split())[:MAX_NAME_LENGTH].strip()
        return name[:1].upper() + name[1:] if name else f"Other part {number}"
    return f"{item.label.replace('_', ' ').capitalize()} {number}"
