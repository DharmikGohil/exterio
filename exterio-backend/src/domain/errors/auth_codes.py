from enum import StrEnum


class AuthErrorCode(StrEnum):
    INVALID_CREDENTIALS = "AUTH_001"
    EMAIL_EXISTS = "AUTH_002"
    UNAUTHORIZED = "AUTH_003"
    WEAK_PASSWORD = "AUTH_004"
