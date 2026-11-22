from dataclasses import replace
from datetime import timedelta
from typing import cast

from domain.entities.project_entity import ProjectImage, QualityReport
from domain.entities.region_entity import RegionLabel
from domain.services.__tests__.builders import (
    NOW,
    build_design,
    build_project,
    build_region,
    build_scale,
)
from domain.services.project_progress import latest_priced_design, project_progress

IMAGE = ProjectImage(path="photo.jpg", width=100, height=100, quality=cast(QualityReport, None))
WALL = build_region("wall-1", RegionLabel.WALL)


def test_a_project_without_a_photo_is_at_the_first_step():
    actual = project_progress(build_project(()), [build_design({})])

    assert (actual.step, actual.label, actual.has_estimate) == (1, "No photo yet", False)


def test_a_photo_without_parts_is_at_marking():
    actual = project_progress(build_project((), image=IMAGE), [build_design({})])

    assert (actual.step, actual.label) == (2, "Photo added")


def test_marked_parts_without_finishes_are_being_designed_with_or_without_a_size():
    unsized = project_progress(build_project((WALL,), image=IMAGE), [build_design({})])
    sized = project_progress(
        build_project((WALL,), image=IMAGE, scale=build_scale()), [build_design({})]
    )

    assert (unsized.step, unsized.label) == (3, "Designing")
    assert (sized.step, sized.label) == (3, "Designing"), "the size is not a step of its own"


def test_any_finish_makes_the_estimate_ready_even_without_a_size():
    project = build_project((WALL,), image=IMAGE)

    actual = project_progress(project, [build_design({}), build_design({"wall-1": "paint"})])

    assert (actual.step, actual.label, actual.has_estimate) == (4, "Estimate ready", True)


def test_a_finish_on_a_part_that_no_longer_exists_does_not_count():
    project = build_project((WALL,), image=IMAGE, scale=build_scale())

    actual = project_progress(project, [build_design({"deleted-part": "paint"})])

    assert actual.step == 3


def test_the_latest_priced_design_is_the_most_recently_edited_one_with_a_finish():
    project = build_project((WALL,), image=IMAGE)
    older = replace(build_design({"wall-1": "paint"}), id="older")
    newer = replace(older, id="newer", updated_at=NOW + timedelta(hours=1))
    unpriced = replace(build_design({}), id="unpriced", updated_at=NOW + timedelta(hours=2))

    actual = latest_priced_design(project, [older, unpriced, newer])

    assert actual is not None and actual.id == "newer"
