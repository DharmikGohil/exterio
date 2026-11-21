"""Central error handling: one place maps errors to HTTP responses and logs them.

Use cases raise domain errors and controllers let them propagate; FastAPI
routes every exception here, so controllers contain no error handling at all.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from domain.errors.auth_codes import AuthErrorCode
from domain.errors.base_error import DomainError
from domain.errors.project_codes import (
    AiErrorCode,
    DesignErrorCode,
    ImageErrorCode,
    ProjectErrorCode,
)
from infrastructure.utils.logger import logger
from presentation.utils.response_util import to_camel_json

ERROR_TO_STATUS: dict[str, int] = {
    AuthErrorCode.INVALID_CREDENTIALS: 401,
    AuthErrorCode.EMAIL_EXISTS: 409,
    AuthErrorCode.UNAUTHORIZED: 401,
    AuthErrorCode.WEAK_PASSWORD: 400,
    ProjectErrorCode.PROJECT_NOT_FOUND: 404,
    ProjectErrorCode.IMAGE_REQUIRED: 409,
    ProjectErrorCode.INVALID_REGION: 400,
    ProjectErrorCode.INVALID_SCALE: 400,
    ProjectErrorCode.INVALID_RATE: 400,
    ImageErrorCode.UNREADABLE: 400,
    ImageErrorCode.REJECTED: 422,
    ImageErrorCode.TOO_LARGE: 413,
    DesignErrorCode.DESIGN_NOT_FOUND: 404,
    DesignErrorCode.INVALID_ASSIGNMENT: 400,
    DesignErrorCode.RENDER_IN_PROGRESS: 409,
    DesignErrorCode.RENDER_LIMIT_REACHED: 429,
    AiErrorCode.NOT_CONFIGURED: 503,
    AiErrorCode.PROVIDER_FAILED: 502,
}

VALIDATION_ERROR_CODE = "VALIDATION_001"
HTTP_ERROR_CODE = "HTTP_ERROR"
SERVER_ERROR_CODE = "SERVER_ERROR"
SERVER_ERROR_STATUS = 500


def _error(status: int, message: str, code: str, details: object | None = None) -> JSONResponse:
    body: dict[str, object] = {"status": "error", "message": message, "code": code}
    if details is not None:
        body["details"] = details
    return JSONResponse(status_code=status, content=body)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(request: Request, error: DomainError) -> JSONResponse:
        status = ERROR_TO_STATUS.get(error.code, SERVER_ERROR_STATUS)
        logger.info("%s %s -> %s %s", request.method, request.url.path, status, error.code)
        details = to_camel_json(error.details) if error.details is not None else None
        return _error(status, error.message, error.code, details)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
        first = error.errors()[0] if error.errors() else {}
        location = ".".join(str(part) for part in first.get("loc", ()) if part != "body")
        message = (
            f"{location}: {first.get('msg', 'Invalid request')}" if location else "Invalid request"
        )
        return _error(400, message, VALIDATION_ERROR_CODE)

    @app.exception_handler(HTTPException)
    async def handle_http_error(_: Request, error: HTTPException) -> JSONResponse:
        return _error(error.status_code, str(error.detail), HTTP_ERROR_CODE)

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, error: Exception) -> JSONResponse:
        logger.exception(
            "Unhandled error on %s %s", request.method, request.url.path, exc_info=error
        )
        return _error(SERVER_ERROR_STATUS, "Internal server error", SERVER_ERROR_CODE)
