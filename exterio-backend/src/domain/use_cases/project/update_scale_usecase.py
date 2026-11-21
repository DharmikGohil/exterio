from dataclasses import replace
from datetime import UTC, datetime

from domain.entities.scale_reference_entity import ScaleReference
from domain.errors.project_errors import ImageRequiredError
from domain.interfaces.dtos.project_dto import ProjectDTO
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.services.project_access import get_owned_project
from domain.services.region_validator import clamp_point, validate_scale
from domain.use_cases.project.project_reader import ProjectReader
from domain.use_cases.project.project_refresher import ProjectRefresher


class UpdateScaleUseCase:
    def __init__(
        self, project_repo: IProjectRepository, reader: ProjectReader, refresher: ProjectRefresher
    ) -> None:
        self._project_repo = project_repo
        self._reader = reader
        self._refresher = refresher

    def execute(self, project_id: str, user_id: str, scale: ScaleReference) -> ProjectDTO:
        project = get_owned_project(self._project_repo, project_id, user_id)
        if project.image is None:
            raise ImageRequiredError
        width, height = project.image.width, project.image.height

        tl, tr, br, bl = (clamp_point(point, width, height) for point in scale.facade_corners)
        line = scale.reference_line
        if line is not None:
            line = (clamp_point(line[0], width, height), clamp_point(line[1], width, height))
        cleaned = replace(scale, facade_corners=(tl, tr, br, bl), reference_line=line)
        validate_scale(cleaned, width, height)

        updated = self._project_repo.update(
            replace(project, scale=cleaned, updated_at=datetime.now(UTC))
        )
        self._refresher.refresh_designs(updated)
        return self._reader.to_dto(updated)
