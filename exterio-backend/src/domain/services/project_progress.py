"""How far along a house is, for the project list: the studio step it is at and a short label."""

from collections.abc import Sequence
from dataclasses import dataclass

from domain.entities.design_entity import Design
from domain.entities.project_entity import Project

STEP_COUNT = 5


@dataclass(frozen=True)
class ProjectProgress:
    """`step` is the studio step to carry on at (1 Photo … 5 Estimate); `label` says where it is."""

    step: int
    label: str
    has_estimate: bool


def project_progress(project: Project, designs: Sequence[Design]) -> ProjectProgress:
    """Reads progress from what has been saved, so it never drifts from the project itself.

    The steps follow the studio: photo, parts, design, estimate. The real-world size is not a
    step; it is set from the estimate, and until then a default is assumed, so a design with any
    finish chosen means the estimate is ready whether or not the size was set.
    """
    if project.image is None:
        return ProjectProgress(step=1, label="No photo yet", has_estimate=False)
    if not project.regions:
        return ProjectProgress(step=2, label="Photo added", has_estimate=False)
    if any(_has_finishes(design, project) for design in designs):
        return ProjectProgress(step=4, label="Estimate ready", has_estimate=True)
    return ProjectProgress(step=3, label="Designing", has_estimate=False)


def latest_priced_design(project: Project, designs: Sequence[Design]) -> Design | None:
    """The most recently edited design with at least one finish on a part that still exists."""
    priced = [design for design in designs if _has_finishes(design, project)]
    return max(priced, key=lambda design: design.updated_at, default=None)


def _has_finishes(design: Design, project: Project) -> bool:
    region_ids = project.region_ids()
    return any(region_id in region_ids for region_id in design.assignments)
