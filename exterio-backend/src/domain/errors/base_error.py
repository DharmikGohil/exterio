"""Base class for every error raised by the domain layer."""

from typing import Any


class DomainError(Exception):
    def __init__(self, message: str, code: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details
