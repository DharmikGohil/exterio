import cv2
import numpy as np
import pytest

from domain.errors.project_errors import UnreadableImageError
from domain.interfaces.services.image_services import PreviewRequest
from infrastructure.repository.implementation.material_repo_impl import JsonMaterialRepository
from infrastructure.services.imaging.image_codec import decode_image, encode_jpeg
from infrastructure.services.imaging.opencv_image_inspection_service import (
    OpenCvImageInspectionService,
)
from infrastructure.services.imaging.opencv_preview_render_service import (
    OpenCvPreviewRenderService,
)
from infrastructure.services.imaging.sample_house_provider import SampleHouseProvider


@pytest.fixture(scope="module")
def sample():
    return SampleHouseProvider().build()


@pytest.fixture(scope="module")
def inspection():
    return OpenCvImageInspectionService(max_upload_mb=15)


def issue_codes(report):
    return {issue.code for issue in report.issues}


def test_good_photo_is_usable_with_a_full_score(sample, inspection):
    actual = inspection.prepare(sample.image)

    assert actual.report.usable
    assert actual.report.score == 100
    assert (actual.width, actual.height) == (1500, 1000)


def test_large_photo_is_downscaled_to_the_working_size(inspection):
    rng = np.random.default_rng(1)
    input_image = encode_jpeg(rng.integers(0, 255, (2400, 3200, 3), dtype=np.uint8))

    actual = inspection.prepare(input_image)

    assert max(actual.width, actual.height) == 1600


def test_tiny_photo_is_rejected_with_guidance(sample, inspection):
    input_image = encode_jpeg(cv2.resize(decode_image(sample.image), (300, 200)))

    actual = inspection.prepare(input_image)

    assert not actual.report.usable
    assert "LOW_RESOLUTION" in issue_codes(actual.report)
    assert actual.report.guidance


def test_dark_and_featureless_photo_is_rejected(inspection):
    input_image = encode_jpeg(np.full((900, 1200, 3), 8, dtype=np.uint8))

    actual = inspection.prepare(input_image)

    assert not actual.report.usable
    assert {"TOO_DARK", "BLURRY"} <= issue_codes(actual.report)


def test_heavily_blurred_photo_is_rejected(sample, inspection):
    input_image = encode_jpeg(cv2.GaussianBlur(decode_image(sample.image), (0, 0), 25))

    actual = inspection.prepare(input_image)

    assert "BLURRY" in issue_codes(actual.report)


def test_non_image_bytes_raise_a_domain_error(inspection):
    with pytest.raises(UnreadableImageError):
        inspection.prepare(b"this is not an image")


def test_preview_changes_assigned_regions_and_nothing_else(sample):
    materials = JsonMaterialRepository()
    wall = next(region for region in sample.regions if region.name == "Front wall")
    input_request = PreviewRequest(
        image=sample.image,
        regions=sample.regions,
        materials_by_region={wall.id: materials.find_by_id("stone-grey-ledge")},
        facade_corners=sample.scale.facade_corners,
        facade_width_ft=30.0,
        facade_height_ft=20.0,
    )

    actual = decode_image(OpenCvPreviewRenderService().render(input_request)).astype(np.int16)

    original = decode_image(sample.image).astype(np.int16)
    difference = np.abs(actual - original).mean(axis=2)
    sky = difference[:80, :]
    window = next(region for region in sample.regions if region.name == "Ground window left")
    xs = [int(x) for x, _ in window.polygon]
    ys = [int(y) for _, y in window.polygon]
    window_interior = difference[min(ys) + 12 : max(ys) - 12, min(xs) + 12 : max(xs) - 12]
    wall_patch = difference[620:700, 500:580]

    assert sky.mean() < 3, "pixels outside every region must be untouched"
    assert window_interior.mean() < 3, "a window on top of the wall must not be painted"
    assert wall_patch.mean() > 20, "the assigned wall must visibly change"


def test_rejected_photo_scores_low_and_gives_no_contradictory_praise(sample, inspection):
    input_image = encode_jpeg(cv2.resize(decode_image(sample.image), (300, 200)))

    actual = inspection.prepare(input_image)

    assert actual.report.score <= 30
    assert not any("Looks good" in tip for tip in actual.report.guidance)


def test_good_photo_has_no_tips(sample, inspection):
    assert inspection.prepare(sample.image).report.guidance == ()
