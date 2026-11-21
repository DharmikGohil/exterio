from fastapi import Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.auth_schema import UserResponse


class GetMeController:
    def handle(self, user: UserDTO = Depends(get_authenticated_user)) -> UserResponse:
        return UserResponse.model_validate(user)
