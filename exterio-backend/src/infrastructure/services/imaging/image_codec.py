"""Encode/decode helpers shared by the OpenCV services."""

import cv2
import numpy as np
from numpy.typing import NDArray

from domain.errors.project_errors import UnreadableImageError

ImageArray = NDArray[np.uint8]
FloatArray = NDArray[np.float32]

JPEG_QUALITY = 90


def decode_image(data: bytes) -> ImageArray:
    buffer = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise UnreadableImageError
    return image.astype(np.uint8)


def encode_jpeg(image: ImageArray, quality: int = JPEG_QUALITY) -> bytes:
    ok, encoded = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise UnreadableImageError
    return bytes(encoded.tobytes())


def encode_png(image: ImageArray) -> bytes:
    ok, encoded = cv2.imencode(".png", image)
    if not ok:
        raise UnreadableImageError
    return bytes(encoded.tobytes())


def hex_to_bgr(color_hex: str) -> tuple[float, float, float]:
    """'#RRGGBB' -> (b, g, r) as floats in 0..1."""
    value = color_hex.lstrip("#")
    red, green, blue = (int(value[index : index + 2], 16) / 255.0 for index in (0, 2, 4))
    return (blue, green, red)
