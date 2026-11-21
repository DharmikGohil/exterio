from fastapi import Depends, Response, status

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.project.delete_project_usecase import DeleteProjectUseCase
from presentation.middleware.auth_middleware import get_authenticated_user


class DeleteProjectController:
    def __init__(self, delete_project: DeleteProjectUseCase) -> None:
        self._delete_project = delete_project

    def handle(self, project_id: str, user: UserDTO = Depends(get_authenticated_user)) -> Response:
        self._delete_project.execute(project_id, user.id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
