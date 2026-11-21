from dataclasses import dataclass


@dataclass(frozen=True)
class RegisterRequestDTO:
    email: str
    password: str
    name: str


@dataclass(frozen=True)
class LoginRequestDTO:
    email: str
    password: str


@dataclass(frozen=True)
class UserDTO:
    id: str
    email: str | None
    name: str
    is_guest: bool


@dataclass(frozen=True)
class DemoAccountDTO:
    """A shared, published sign-in for reviewers. Not a secret: it is shown on the sign-in page."""

    email: str
    password: str


@dataclass(frozen=True)
class AuthResponseDTO:
    access_token: str
    user: UserDTO
