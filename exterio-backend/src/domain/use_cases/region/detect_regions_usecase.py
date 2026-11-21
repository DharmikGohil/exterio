from dataclasses import replace
from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.region_entity import MIN_POLYGON_POINTS, Region, RegionLabel, RegionSource
from domain.errors.project_errors import AiNotConfiguredError, ImageRequiredError
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
        project = get_owned_project(self._project_repo, project_id, user_id)
        if project.image is None:
            raise ImageRequiredError
        if not self._segmentation.is_available():
            raise AiNotConfiguredError("Automatic region detection")

        detected = self._segmentation.detect(
            self._storage.read(project.image.path), project.image.width, project.image.height
        )
        kept = tuple(region for region in project.regions if region.source == RegionSource.USER)
        regions = (*kept, *self._name_regions(detected, kept))

        updated = self._project_repo.update(
            replace(project, regions=regions, updated_at=datetime.now(UTC))
        )
        self._refresher.refresh_designs(updated)
        return self._reader.to_dto(updated)

    @staticmethod
    def _name_regions(detected: list[DetectedRegion], kept: tuple[Region, ...]) -> list[Region]:
        counters: dict[RegionLabel, int] = {}
        for region in kept:
            counters[region.label] = counters.get(region.label, 0) + 1
        regions: list[Region] = []
        for item in detected:
            if len(item.polygon) < MIN_POLYGON_POINTS:
                continue
            counters[item.label] = counters.get(item.label, 0) + 1
            regions.append(
                Region(
                    id=str(uuid4()),
                    label=item.label,
                    name=_region_name(item, counters[item.label]),
                    polygon=item.polygon,
                    source=RegionSource.AUTO,
                    surface_multiplier=DEFAULT_MULTIPLIERS.get(item.label, 1.0),
                )
            )
        return regions


def _region_name(item: DetectedRegion, number: int) -> str:
    """Stock parts are numbered ("Window 2"); an `other` part keeps the detector's own name."""
    if item.label == RegionLabel.OTHER:
        name = " ".join((item.name or "").split())[:MAX_NAME_LENGTH].strip()
        return name[:1].upper() + name[1:] if name else f"Other part {number}"
    return f"{item.label.replace('_', ' ').capitalize()} {number}"
