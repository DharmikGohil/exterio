import pytest

from render_sizing import fit_for_sdxl


@pytest.mark.parametrize(
    ("size", "expected"),
    [
        ((1500, 1000), (1024, 680)),  # the sample house
        ((4032, 3024), (1024, 768)),  # a phone photo
        ((900, 1600), (576, 1024)),  # portrait
    ],
)
def test_long_side_becomes_1024_on_the_8px_grid(size, expected):
    assert fit_for_sdxl(*size) == expected


def test_keeps_the_aspect_ratio_within_one_block():
    width, height = fit_for_sdxl(4032, 3024)
    assert abs(width / height - 4032 / 3024) < 0.02


def test_a_narrow_photo_is_enlarged_towards_a_usable_short_side():
    assert fit_for_sdxl(2000, 900) == (1136, 512)


def test_a_panorama_is_capped_at_1536_wide():
    width, height = fit_for_sdxl(4000, 800)
    assert width == 1536
    assert height % 8 == 0


@pytest.mark.parametrize(("width", "height"), [(0, 100), (100, -1)])
def test_rejects_impossible_sizes(width, height):
    with pytest.raises(ValueError):
        fit_for_sdxl(width, height)
