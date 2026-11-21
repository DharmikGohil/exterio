from fastapi import Depends, UploadFile

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.project.upload_project_image_usecase import UploadProjectImageUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectResponse

# Read one byte more than any sane limit so the use case can reject oversized files
# without the server buffering an unbounded upload.
MAX_READ_BYTES = 40 * 1024 * 1024 + 1


class UploadProjectImageController:
    def __init__(self, upload_image: UploadProjectImageUseCase) -> None:
        self._upload_image = upload_image

    def handle(
        self, project_id: str, file: UploadFile, user: UserDTO = Depends(get_authenticated_user)
    ) -> ProjectResponse:
        raw = file.file.read(MAX_READ_BYTES)
        return ProjectResponse.model_validate(self._upload_image.execute(project_id, user.id, raw))
