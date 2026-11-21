"""Bearer-token authentication.

The middleware is attached to a router as a dependency. It resolves the user
once and stores it on the request; controllers read it with
`Depends(get_authenticated_user)`.
"""

from fastapi import Request

from domain.errors.auth_errors import UnauthorizedError
from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.auth.get_current_user_usecase import GetCurrentUserUseCase

BEARER_PREFIX = "bearer "


class AuthMiddleware:
    def __init__(self, get_current_user: GetCurrentUserUseCase) -> None:
        self._get_current_user = get_current_user

    def authenticate(self, request: Request) -> None:
        header = request.headers.get("authorization", "")
        token = (
            header[len(BEARER_PREFIX) :].strip()
            if header.lower().startswith(BEARER_PREFIX)
            else None
        )
        request.state.user = self._get_current_user.execute(token)


def get_authenticated_user(request: Request) -> UserDTO:
    user = getattr(request.state, "user", None)
    if not isinstance(user, UserDTO):
        raise UnauthorizedError
    return user
