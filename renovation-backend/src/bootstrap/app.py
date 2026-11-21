"""FastAPI application factory: middleware, routes and static files."""

from os import PathLike, stat_result
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response
from starlette.types import Scope

from bootstrap.env import Settings
from domain.use_cases.auth.ensure_demo_account_usecase import EnsureDemoAccountUseCase
from infrastructure.registry import InfrastructureRegistry, build_registry
from infrastructure.repository.sqlalchemy.config.database import SQLITE_PREFIX
from infrastructure.utils.logger import configure_logging
from presentation.middleware.error_middleware import register_error_handlers
from presentation.routes.advisor_routes import build_advisor_router
from presentation.routes.auth_routes import build_auth_router
from presentation.routes.catalog_routes import build_catalog_router
from presentation.routes.design_routes import build_design_router
from presentation.routes.project_routes import build_project_router
from presentation.routes.shared_wiring import build_shared_wiring

API_PREFIX = "/api"
FILES_PREFIX = "/files"
FILE_CACHE_SECONDS = 60 * 60 * 24 * 30


class CachedStaticFiles(StaticFiles):
    """Stored files get a new path whenever they change, so they can be cached for long."""

    def file_response(
        self,
        full_path: str | PathLike[str],
        stat_result: stat_result,
        scope: Scope,
        status_code: int = 200,
    ) -> Response:
        response = super().file_response(full_path, stat_result, scope, status_code)
        response.headers["Cache-Control"] = f"public, max-age={FILE_CACHE_SECONDS}"
        return response


def create_app(settings: Settings, registry: InfrastructureRegistry | None = None) -> FastAPI:
    configure_logging(settings.log_level)
    if registry is None:
        if (
            settings.database_url.startswith(SQLITE_PREFIX)
            and ":memory:" not in settings.database_url
        ):
            Path(settings.database_url.split("///", 1)[1]).parent.mkdir(parents=True, exist_ok=True)
        registry = build_registry(settings.to_infrastructure_config())

    app = FastAPI(
        title="Exterio API",
        description="AI exterior house renovation and cost estimation",
        version="1.0.0",
        docs_url=f"{API_PREFIX}/docs",
        openapi_url=f"{API_PREFIX}/openapi.json",
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )
    register_error_handlers(app)

    shared = build_shared_wiring(registry)
    demo_account = None
    if settings.has_demo_account:
        demo_account = EnsureDemoAccountUseCase(
            registry.user_repo,
            registry.project_repo,
            registry.password_hasher,
            shared.create_sample_project,
        ).execute(settings.demo_account_email, settings.demo_account_password)
    api = APIRouter(prefix=API_PREFIX)
    api.add_api_route("/health-check", lambda: {"status": "ok"}, methods=["GET"], tags=["System"])
    api.include_router(build_auth_router(registry, shared, demo_account))
    api.include_router(build_catalog_router(registry, shared))
    api.include_router(build_project_router(registry, shared))
    api.include_router(build_design_router(registry, shared))
    api.include_router(build_advisor_router(registry, shared))
    app.include_router(api)

    app.mount(FILES_PREFIX, CachedStaticFiles(directory=registry.storage_root), name="files")
    return app
