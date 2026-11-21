from domain.entities.project_entity import Project
from domain.entities.scale_reference_entity import ScaleMethod, ScaleReference
from domain.errors.project_errors import ImageRequiredError
from domain.interfaces.dtos.estimate_dto import ResolvedScaleDTO
from domain.interfaces.dtos.measurement_dto import RectifiedSurface
from domain.interfaces.services.image_services import ISurfaceMeasurementService
from domain.services.default_scale import default_scale_reference
from domain.services.scale_resolver import resolve_scale


class MeasureFacadeUseCase:
    """Removes perspective from the photo and resolves pixels to feet.

    Shared by the estimate, the preview renderer and the report so that the
    picture and the numbers always come from the same measurement.
    """

    def __init__(self, measurement: ISurfaceMeasurementService) -> None:
        self._measurement = measurement

    def execute(
        self, project: Project
    ) -> tuple[ScaleReference, RectifiedSurface, ResolvedScaleDTO]:
        if project.image is None:
            raise ImageRequiredError
        width, height = project.image.width, project.image.height
        reference = project.scale or default_scale_reference(project.regions, width, height)
        surface = self._measurement.measure(
            width,
            height,
            project.regions,
            reference.facade_corners,
            reference.reference_line,
            self._known_aspect_ratio(reference),
        )
        return reference, surface, resolve_scale(reference, surface, project.regions)

    @staticmethod
    def _known_aspect_ratio(reference: ScaleReference) -> float | None:
        if (
            reference.method == ScaleMethod.FACADE_DIMENSIONS
            and reference.facade_width_ft
            and reference.facade_height_ft
        ):
            return reference.facade_width_ft / reference.facade_height_ft
        return None
