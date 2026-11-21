from dataclasses import replace
from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.region_entity import Region, RegionSource
from domain.errors.project_errors import ImageRequiredError
from domain.interfaces.dtos.project_dto import ProjectDTO, RegionInputDTO
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.services.project_access import get_owned_project
from domain.services.region_validator import clamp_point, validate_region_inputs
from domain.use_cases.project.project_reader import ProjectReader
from domain.use_cases.project.project_refresher import ProjectRefresher


class ReplaceRegionsUseCase:
    """Saves the user's reviewed regions. This is the 'adjust or correct areas' step."""

    def __init__(
        self, project_repo: IProjectRepository, reader: ProjectReader, refresher: ProjectRefresher
    ) -> None:
        self._project_repo = project_repo
        self._reader = reader
        self._refresher = refresher

    def execute(self, project_id: str, user_id: str, inputs: list[RegionInputDTO]) -> ProjectDTO:
        project = get_owned_project(self._project_repo, project_id, user_id)
        if project.image is None:
            raise ImageRequiredError
        validate_region_inputs(inputs)

        width, height = project.image.width, project.image.height
        existing = {region.id: region for region in project.regions}
        regions = tuple(self._to_region(item, existing, width, height) for item in inputs)

        updated = self._project_repo.update(
            replace(project, regions=regions, updated_at=datetime.now(UTC))
        )
        self._refresher.refresh_designs(updated)
        return self._reader.to_dto(updated)

    @staticmethod
    def _to_region(
        item: RegionInputDTO, existing: dict[str, Region], width: int, height: int
    ) -> Region:
        previous = existing.get(item.id) if item.id else None
        polygon = tuple(clamp_point(point, width, height) for point in item.polygon)
        # A detected region the user reshaped is now the user's region.
        unchanged = previous is not None and previous.polygon == polygon
        source = previous.source if previous is not None and unchanged else RegionSource.USER
        return Region(
            id=previous.id if previous is not None else str(uuid4()),
            label=item.label,
            name=item.name.strip(),
            polygon=polygon,
            source=source,
            surface_multiplier=item.surface_multiplier,
            area_override_sqft=item.area_override_sqft,
            length_override_ft=item.length_override_ft,
        )
