from domain.errors.auth_codes import AuthErrorCode
from domain.errors.base_error import DomainError

MIN_PASSWORD_LENGTH = 8


class InvalidCredentialsError(DomainError):
    def __init__(self) -> None:
        super().__init__("Email or password is incorrect", AuthErrorCode.INVALID_CREDENTIALS)


class EmailAlreadyExistsError(DomainError):
    def __init__(self) -> None:
        super().__init__("An account with this email already exists", AuthErrorCode.EMAIL_EXISTS)


class UnauthorizedError(DomainError):
    def __init__(self) -> None:
        super().__init__("Please sign in to continue", AuthErrorCode.UNAUTHORIZED)


class WeakPasswordError(DomainError):
    def __init__(self) -> None:
        super().__init__(
            f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
            AuthErrorCode.WEAK_PASSWORD,
        )
