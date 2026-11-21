from fastapi import Depends, Response

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.report.generate_design_report_usecase import GenerateDesignReportUseCase
from presentation.middleware.auth_middleware import get_authenticated_user


class DownloadDesignReportController:
    def __init__(self, generate_report: GenerateDesignReportUseCase) -> None:
        self._generate_report = generate_report

    def handle(self, design_id: str, user: UserDTO = Depends(get_authenticated_user)) -> Response:
        report = self._generate_report.execute(design_id, user.id)
        return Response(
            content=report.content,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{report.filename}"'},
        )
