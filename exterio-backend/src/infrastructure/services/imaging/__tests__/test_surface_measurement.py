"""End-to-end area accuracy on the sample house, whose true dimensions are known."""

import pytest

from domain.entities.region_entity import RegionLabel
from domain.entities.scale_reference_entity import ScaleMethod
from domain.services.area_calculator import compute_region_areas
from domain.services.scale_resolver import resolve_scale
from infrastructure.services.imaging.opencv_surface_measurement_service import (
    OpenCvSurfaceMeasurementService,
)
from infrastructure.services.imaging.sample_house_provider import (
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    PARTS,
    SampleHouseProvider,
)

# Front wall 30 x 20 = 600 sq ft, minus everything drawn on top of it:
# door 24.5, four windows 80, balcony door and railing together 54,
# balcony slab 10, two pillars 22.8, roof-edge band 30.
EXPECTED_NET_WALL_SQFT = 600 - 24.5 - 80 - 54 - 10 - 22.8 - 30


@pytest.fixture(scope="module")
def measured_areas():
    sample = SampleHouseProvider().build()
    surface = OpenCvSurfaceMeasurementService().measure(
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        sample.regions,
        sample.scale.facade_corners,
        None,
        sample.scale.facade_width_ft / sample.scale.facade_height_ft,
    )
    scale = resolve_scale(sample.scale, surface, sample.regions)
    areas = compute_region_areas(sample.regions, surface, scale)
    return {area.name: area for area in areas}


def test_scale_is_resolved_from_the_known_wall_size(measured_areas):
    sample = SampleHouseProvider().build()

    assert sample.scale.method == ScaleMethod.FACADE_DIMENSIONS


def test_net_wall_area_excludes_every_opening_and_overlay(measured_areas):
    assert measured_areas["Front wall"].area_sqft == pytest.approx(EXPECTED_NET_WALL_SQFT, rel=0.02)


@pytest.mark.parametrize(
    "name",
    ["Parapet", "Main door", "Ground window left", "Upper window right", "Gate", "Balcony slab"],
)
def test_simple_rectangles_match_their_true_area(measured_areas, name):
    part = next(part for part in PARTS if part.name == name)

    assert measured_areas[name].area_sqft == pytest.approx(part.area_sqft, rel=0.03)


def test_pillar_area_includes_the_exposed_faces_multiplier(measured_areas):
    # 1.2 ft x 9.5 ft visible face, three faces to finish.
    assert measured_areas["Left pillar"].area_sqft == pytest.approx(1.2 * 9.5 * 3, rel=0.04)


def test_railing_is_measured_in_running_feet(measured_areas):
    railing = measured_areas["Balcony railing"]

    assert railing.label == RegionLabel.RAILING
    assert railing.length_ft == pytest.approx(10.0, rel=0.01)


def test_estimated_aspect_ratio_alone_keeps_areas_within_tolerance():
    """Without the typed wall size, only a door-height reference and the geometry are used."""
    sample = SampleHouseProvider().build()
    surface = OpenCvSurfaceMeasurementService().measure(
        CANVAS_WIDTH, CANVAS_HEIGHT, sample.regions, sample.scale.facade_corners, None, None
    )

    assert surface.facade_width_px / surface.facade_height_px == pytest.approx(1.5, rel=0.03)
