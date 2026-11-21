from typing import Any

from domain.errors.base_error import DomainError
from domain.errors.project_codes import (
    AiErrorCode,
    DesignErrorCode,
    ImageErrorCode,
    ProjectErrorCode,
)


class ProjectNotFoundError(DomainError):
    def __init__(self) -> None:
        super().__init__("Project not found", ProjectErrorCode.PROJECT_NOT_FOUND)


class ImageRequiredError(DomainError):
    def __init__(self) -> None:
        super().__init__("Upload a photo of the house first", ProjectErrorCode.IMAGE_REQUIRED)


class InvalidRegionError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message, ProjectErrorCode.INVALID_REGION)


class InvalidScaleError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message, ProjectErrorCode.INVALID_SCALE)


class InvalidRateError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message, ProjectErrorCode.INVALID_RATE)


class UnreadableImageError(DomainError):
    def __init__(self) -> None:
        super().__init__(
            "This file could not be read as an image. Upload a JPG, PNG or WebP photo.",
            ImageErrorCode.UNREADABLE,
        )


class ImageRejectedError(DomainError):
    def __init__(self, details: dict[str, Any]) -> None:
        super().__init__(
            "This photo cannot be used. See the tips and try another one.",
            ImageErrorCode.REJECTED,
            details,
        )


class ImageTooLargeError(DomainError):
    def __init__(self, max_mb: int) -> None:
        super().__init__(f"Photo is larger than {max_mb} MB", ImageErrorCode.TOO_LARGE)


class DesignNotFoundError(DomainError):
    def __init__(self) -> None:
        super().__init__("Design not found", DesignErrorCode.DESIGN_NOT_FOUND)


class InvalidAssignmentError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message, DesignErrorCode.INVALID_ASSIGNMENT)


class RenderInProgressError(DomainError):
    def __init__(self) -> None:
        super().__init__(
            "A render is already in progress for this design", DesignErrorCode.RENDER_IN_PROGRESS
        )


class RenderLimitReachedError(DomainError):
    def __init__(self, limit: int) -> None:
        super().__init__(
            f"Daily limit of {limit} photoreal renders reached. Try again tomorrow.",
            DesignErrorCode.RENDER_LIMIT_REACHED,
        )


class AiNotConfiguredError(DomainError):
    def __init__(self, feature: str) -> None:
        super().__init__(f"{feature} is not configured on this server", AiErrorCode.NOT_CONFIGURED)


class AiProviderError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message, AiErrorCode.PROVIDER_FAILED)
