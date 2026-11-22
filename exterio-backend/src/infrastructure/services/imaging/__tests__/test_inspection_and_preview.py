import cv2
import numpy as np
import pytest

from domain.entities.region_entity import Region, RegionLabel
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


GATE_PX = 1000
BAR_PX, BAR_PITCH_PX = 3, 16
BAR_STARTS = range(8, GATE_PX - BAR_PITCH_PX, BAR_PITCH_PX)


def _barred_gate_photo() -> bytes:
    """A light wall behind thin dark bars, like a gate photographed against a wall.

    Sized like a real upload, so the preview's shading blur (about 6 px here) is wider than a bar.
    """
    image = np.full((GATE_PX, GATE_PX, 3), 170, dtype=np.uint8)
    for x in BAR_STARTS:
        image[:, x : x + BAR_PX] = 35
    return encode_jpeg(image)


def _paint_whole_photo(photo: bytes, material_id: str) -> np.ndarray:
    corners = ((0, 0), (GATE_PX, 0), (GATE_PX, GATE_PX), (0, GATE_PX))
    gate = Region("gate", RegionLabel.GATE, "Gate 1", corners)
    request = PreviewRequest(
        image=photo,
        regions=(gate,),
        materials_by_region={gate.id: JsonMaterialRepository().find_by_id(material_id)},
        facade_corners=corners,
        facade_width_ft=10.0,
        facade_height_ft=10.0,
    )
    return decode_image(OpenCvPreviewRenderService().render(request)).astype(np.int16)


def _bar_contrast(painted: np.ndarray) -> float:
    grey = painted.mean(axis=2)[100:900]
    bars = grey[:, [x + 1 for x in BAR_STARTS]].mean()
    gaps = grey[:, [x + BAR_PITCH_PX // 2 + 1 for x in BAR_STARTS]].mean()
    return float(gaps - bars)


def test_painting_a_gate_keeps_its_bars():
    painted = _paint_whole_photo(_barred_gate_photo(), "paint-premium-ivory")

    assert _bar_contrast(painted) > 60, "paint must keep the photo's detail, not smear it flat"


def test_paint_changes_the_colour_not_the_structure():
    original = decode_image(_barred_gate_photo()).astype(np.int16)
    painted = _paint_whole_photo(_barred_gate_photo(), "paint-terracotta")

    hue_shift = np.abs(painted[..., 2] - painted[..., 0]).mean()
    assert hue_shift > 20, "terracotta must read as a warm colour, not grey"
    assert _bar_contrast(painted) > 0.4 * _bar_contrast(original)


def test_stone_shows_less_of_the_photo_than_paint_but_not_none():
    photo = _barred_gate_photo()

    paint = _bar_contrast(_paint_whole_photo(photo, "paint-premium-ivory"))
    stone = _bar_contrast(_paint_whole_photo(photo, "stone-grey-ledge"))

    assert 8 < stone < paint


def test_the_wall_behind_a_railing_takes_the_wall_finish():
    """A railing is see-through: repainting the wall must repaint it between the bars too."""
    photo = encode_jpeg(np.full((600, 600, 3), (40, 170, 230), dtype=np.uint8))  # a yellow wall
    corners = ((0, 0), (600, 0), (600, 600), (0, 600))
    wall = Region("wall", RegionLabel.WALL, "Front wall", corners)
    railing = Region(
        "railing", RegionLabel.RAILING, "Railing", ((0, 300), (600, 300), (600, 450), (0, 450))
    )
    materials = JsonMaterialRepository()
    request = PreviewRequest(
        image=photo,
        regions=(wall, railing),
        materials_by_region={
            wall.id: materials.find_by_id("paint-sage-grey"),
            railing.id: materials.find_by_id("railing-ms-black"),
        },
        facade_corners=corners,
        facade_width_ft=10.0,
        facade_height_ft=10.0,
    )

    actual = decode_image(OpenCvPreviewRenderService().render(request)).astype(np.int16)

    open_wall = actual[100:200, 100:500].reshape(-1, 3).mean(axis=0)
    behind_railing = np.median(actual[330:440, 50:550].reshape(-1, 3), axis=0)
    assert np.abs(behind_railing - open_wall).max() < 25, (
        "between the bars the wall must look like the rest of the repainted wall, not the old one"
    )
