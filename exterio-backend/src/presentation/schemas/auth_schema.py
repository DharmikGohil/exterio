from pydantic import EmailStr, Field

from presentation.schemas.base_schema import CamelModel


class RegisterRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)
    name: str = Field(default="", max_length=120)


class LoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class UserResponse(CamelModel):
    id: str
    email: str | None
    name: str
    is_guest: bool


class DemoAccountResponse(CamelModel):
    email: str
    password: str


class AuthResponse(CamelModel):
    access_token: str
    user: UserResponse
