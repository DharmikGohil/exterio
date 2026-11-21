from fastapi import Depends, Response, status

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.design.delete_design_usecase import DeleteDesignUseCase
from presentation.middleware.auth_middleware import get_authenticated_user


class DeleteDesignController:
    def __init__(self, delete_design: DeleteDesignUseCase) -> None:
        self._delete_design = delete_design

    def handle(self, design_id: str, user: UserDTO = Depends(get_authenticated_user)) -> Response:
        self._delete_design.execute(design_id, user.id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
