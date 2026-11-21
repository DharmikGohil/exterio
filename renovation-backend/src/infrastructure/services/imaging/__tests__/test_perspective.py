"""Geometry tests against a simulated pinhole camera with known ground truth."""

import numpy as np
import pytest

from infrastructure.services.imaging.perspective import (
    build_rectification,
    edge_aspect_ratio,
    estimate_aspect_ratio,
)

IMAGE_WIDTH, IMAGE_HEIGHT = 1600, 1200


def photograph_rectangle(width, height, yaw_deg, pitch_deg, focal_ratio):
    """Image corners (TL, TR, BR, BL) of a width x height rectangle seen by a rotated camera."""
    focal = focal_ratio * max(IMAGE_WIDTH, IMAGE_HEIGHT)
    yaw, pitch = np.radians(yaw_deg), np.radians(pitch_deg)
    rotate_yaw = np.array(
        [[np.cos(yaw), 0, np.sin(yaw)], [0, 1, 0], [-np.sin(yaw), 0, np.cos(yaw)]]
    )
    rotate_pitch = np.array(
        [[1, 0, 0], [0, np.cos(pitch), -np.sin(pitch)], [0, np.sin(pitch), np.cos(pitch)]]
    )
    distance = 2.2 * max(width, height)
    corners = np.array(
        [
            [-width / 2, -height / 2, 0],
            [width / 2, -height / 2, 0],
            [width / 2, height / 2, 0],
            [-width / 2, height / 2, 0],
        ]
    )
    camera = corners @ (rotate_pitch @ rotate_yaw).T + np.array([0, 0, distance])
    u = focal * camera[:, 0] / camera[:, 2] + IMAGE_WIDTH / 2
    v = focal * camera[:, 1] / camera[:, 2] + IMAGE_HEIGHT / 2
    return tuple((float(x), float(y)) for x, y in zip(u, v, strict=True))


def test_front_on_rectangle_uses_plain_edge_ratio():
    input_corners = ((100.0, 100.0), (700.0, 100.0), (700.0, 500.0), (100.0, 500.0))

    assert edge_aspect_ratio(input_corners) == pytest.approx(1.5)
    assert estimate_aspect_ratio(input_corners, IMAGE_WIDTH, IMAGE_HEIGHT) == pytest.approx(
        1.5, rel=0.01
    )


@pytest.mark.parametrize("focal_ratio", [0.6, 0.9, 1.4])
def test_two_vanishing_points_recover_the_true_ratio_for_any_focal_length(focal_ratio):
    # Yaw and pitch together give two finite vanishing points, so the focal length is
    # recovered from the corners and the ratio is exact whatever lens took the photo.
    input_corners = photograph_rectangle(30, 20, yaw_deg=25, pitch_deg=12, focal_ratio=focal_ratio)

    actual = estimate_aspect_ratio(input_corners, IMAGE_WIDTH, IMAGE_HEIGHT)

    assert actual == pytest.approx(1.5, rel=0.02)
    # The naive edge ratio is visibly wrong for the same photo.
    assert abs(edge_aspect_ratio(input_corners) - 1.5) > abs(actual - 1.5)


def test_level_camera_falls_back_to_a_typical_phone_focal_length():
    # Verticals are parallel, so the focal length cannot be recovered. With the assumed
    # phone focal length the estimate is exact; with a different lens it is approximate.
    input_matching = photograph_rectangle(30, 20, yaw_deg=25, pitch_deg=0, focal_ratio=0.75)
    input_other_lens = photograph_rectangle(30, 20, yaw_deg=25, pitch_deg=0, focal_ratio=1.1)

    assert estimate_aspect_ratio(input_matching, IMAGE_WIDTH, IMAGE_HEIGHT) == pytest.approx(
        1.5, rel=0.02
    )
    assert estimate_aspect_ratio(input_other_lens, IMAGE_WIDTH, IMAGE_HEIGHT) == pytest.approx(
        1.5, rel=0.12
    )


def test_rectification_maps_facade_corners_onto_a_rectangle():
    input_corners = photograph_rectangle(30, 20, yaw_deg=20, pitch_deg=8, focal_ratio=0.8)

    rectification = build_rectification(input_corners, IMAGE_WIDTH, IMAGE_HEIGHT, 1.5, 600.0)
    actual = rectification.transform(input_corners)

    expected = np.array([[0, 0], [900, 0], [900, 600], [0, 600]])
    assert np.allclose(actual, expected, atol=0.5)


def test_points_beyond_the_horizon_are_clamped_not_flipped():
    input_corners = photograph_rectangle(30, 20, yaw_deg=60, pitch_deg=0, focal_ratio=0.5)
    rectification = build_rectification(input_corners, IMAGE_WIDTH, IMAGE_HEIGHT, 1.5, 600.0)

    actual = rectification.transform([(-50000.0, 600.0), (50000.0, 600.0)])

    min_x, min_y, max_x, max_y = rectification.bounds
    assert np.all(np.isfinite(actual))
    assert np.all(actual[:, 0] >= min_x) and np.all(actual[:, 0] <= max_x)
    assert np.all(actual[:, 1] >= min_y) and np.all(actual[:, 1] <= max_y)
