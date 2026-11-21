"""Upload normalisation and the pixel-level quality gate."""

import io

import cv2
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from domain.entities.project_entity import (
    IssueSeverity,
    QualityIssue,
    QualityMetrics,
    QualityReport,
)
from domain.errors.project_errors import UnreadableImageError
from domain.interfaces.services.image_services import IImageInspectionService, PreparedImage
from infrastructure.services.imaging.image_codec import ImageArray, decode_image, encode_jpeg

WORKING_LONG_SIDE = 1600
BLUR_SAMPLE_LONG_SIDE = 1024

MIN_SHORT_SIDE_REJECT = 400
MIN_SHORT_SIDE_WARN = 700
# Variance of the Laplacian on a 1024 px copy. Calibrated on phone photos of
# buildings; a fixed threshold is scene dependent, so only extreme blur rejects.
BLUR_REJECT = 12.0
BLUR_WARN = 60.0
DARK_REJECT = 35.0
DARK_WARN = 65.0
BRIGHT_WARN = 215.0
MAX_ASPECT_WARN = 2.6

ERROR_PENALTY = 45
WARNING_PENALTY = 15
MAX_SCORE = 100
MAX_SCORE_WHEN_UNUSABLE = 30


class OpenCvImageInspectionService(IImageInspectionService):
    def __init__(self, max_upload_mb: int) -> None:
        self._max_upload_mb = max_upload_mb

    def max_upload_mb(self) -> int:
        return self._max_upload_mb

    def prepare(self, raw: bytes) -> PreparedImage:
        image = self._load_upright(raw)
        original_height, original_width = image.shape[:2]
        image = self._resize(image, WORKING_LONG_SIDE)
        height, width = image.shape[:2]
        report = self._assess(image, original_width, original_height)
        return PreparedImage(data=encode_jpeg(image), width=width, height=height, report=report)

    def thumbnail(self, image: bytes, max_side: int) -> bytes:
        return encode_jpeg(self._resize(decode_image(image), max_side), quality=82)

    @staticmethod
    def _load_upright(raw: bytes) -> ImageArray:
        """Decode and apply the EXIF orientation that phones store instead of rotating."""
        try:
            with Image.open(io.BytesIO(raw)) as picture:
                upright = ImageOps.exif_transpose(picture).convert("RGB")
        except (UnidentifiedImageError, OSError, ValueError) as error:
            raise UnreadableImageError from error
        return cv2.cvtColor(np.asarray(upright, dtype=np.uint8), cv2.COLOR_RGB2BGR).astype(np.uint8)

    @staticmethod
    def _resize(image: ImageArray, long_side: int) -> ImageArray:
        height, width = image.shape[:2]
        scale = long_side / max(height, width)
        if scale >= 1:
            return image
        size = (max(int(width * scale), 1), max(int(height * scale), 1))
        return cv2.resize(image, size, interpolation=cv2.INTER_AREA).astype(np.uint8)

    def _assess(
        self, image: ImageArray, original_width: int, original_height: int
    ) -> QualityReport:
        gray = cv2.cvtColor(self._resize(image, BLUR_SAMPLE_LONG_SIDE), cv2.COLOR_BGR2GRAY)
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(gray.mean())
        short_side = min(original_width, original_height)
        aspect = max(original_width, original_height) / max(short_side, 1)

        issues: list[QualityIssue] = []
        guidance: list[str] = []

        def add(code: str, severity: IssueSeverity, message: str, tip: str) -> None:
            issues.append(QualityIssue(code, severity, message))
            guidance.append(tip)

        if short_side < MIN_SHORT_SIDE_REJECT:
            add(
                "LOW_RESOLUTION",
                IssueSeverity.ERROR,
                f"The photo is only {original_width} x {original_height} pixels.",
                "Use the original photo from your camera, not a screenshot or a forwarded copy.",
            )
        elif short_side < MIN_SHORT_SIDE_WARN:
            add(
                "LOW_RESOLUTION",
                IssueSeverity.WARNING,
                "The photo is small, so fine details may be missed.",
                "A higher-resolution photo will give cleaner region detection.",
            )

        if blur_score < BLUR_REJECT:
            add(
                "BLURRY",
                IssueSeverity.ERROR,
                "The photo is too blurry to find the edges of walls and windows.",
                "Hold the phone steady, tap the house to focus, and retake the photo.",
            )
        elif blur_score < BLUR_WARN:
            add(
                "SOFT_FOCUS",
                IssueSeverity.WARNING,
                "The photo is slightly soft.",
                "A sharper photo will make edges and measurements more accurate.",
            )

        if brightness < DARK_REJECT:
            add(
                "TOO_DARK",
                IssueSeverity.ERROR,
                "The photo is too dark to see the building surfaces.",
                "Take the photo in daylight with the sun behind you.",
            )
        elif brightness < DARK_WARN:
            add(
                "DARK",
                IssueSeverity.WARNING,
                "The photo is quite dark.",
                "Daylight photos give more realistic material previews.",
            )
        elif brightness > BRIGHT_WARN:
            add(
                "OVEREXPOSED",
                IssueSeverity.WARNING,
                "The photo is very bright and some surfaces are washed out.",
                "Avoid shooting towards the sun.",
            )

        if aspect > MAX_ASPECT_WARN:
            add(
                "PANORAMA",
                IssueSeverity.WARNING,
                "The photo is very wide. Panoramas bend straight walls.",
                "Use a normal photo taken from across the street instead of a panorama.",
            )

        errors = sum(1 for issue in issues if issue.severity == IssueSeverity.ERROR)
        score = MAX_SCORE - errors * ERROR_PENALTY - (len(issues) - errors) * WARNING_PENALTY
        if errors:
            score = min(score, MAX_SCORE_WHEN_UNUSABLE)
        height, width = image.shape[:2]
        return QualityReport(
            usable=errors == 0,
            score=max(score, 0),
            issues=tuple(issues),
            guidance=tuple(guidance),
            metrics=QualityMetrics(width, height, round(blur_score, 1), round(brightness, 1)),
        )
