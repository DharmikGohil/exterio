"""Infrastructure registry: builds every concrete repository and service once.

This is the Python counterpart of a service registry module. Route modules
receive the registry and wire use cases from it; nothing else constructs
infrastructure classes.
"""

from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import Engine

from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.knowledge_repo import IKnowledgeRepository
from domain.interfaces.repos.material_repo import IMaterialRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.repos.user_repo import IUserRepository
from domain.interfaces.services.advisor_service import IAdvisorLanguageModel
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.interfaces.services.image_services import (
    IImageInspectionService,
    IPhotorealRenderService,
    IPreviewRenderService,
    ISampleHouseProvider,
    ISegmentationService,
    ISurfaceMeasurementService,
    IVisionCheckService,
)
from domain.interfaces.services.report_service import IReportService
from domain.interfaces.services.security_service import IPasswordHasher, ITokenService
from domain.mappers.project_mapper import swatch_path
from infrastructure.repository.implementation.design_repo_impl import DesignRepository
from infrastructure.repository.implementation.knowledge_repo_impl import TfidfKnowledgeRepository
from infrastructure.repository.implementation.material_repo_impl import JsonMaterialRepository
from infrastructure.repository.implementation.project_repo_impl import ProjectRepository
from infrastructure.repository.implementation.user_repo_impl import UserRepository
from infrastructure.repository.sqlalchemy.config.database import (
    create_database_engine,
    create_schema,
    create_session_factory,
)
from infrastructure.services.advisor.anthropic_advisor_language_model import (
    AnthropicAdvisorLanguageModel,
)
from infrastructure.services.ai.anthropic_json import build_anthropic_client
from infrastructure.services.ai.anthropic_vision_check_service import AnthropicVisionCheckService
from infrastructure.services.ai.anthropic_vision_segmentation_service import (
    AnthropicVisionSegmentationService,
)
from infrastructure.services.ai.fal_client import FalClient
from infrastructure.services.ai.fal_photoreal_render_service import FalPhotorealRenderService
from infrastructure.services.ai.fal_sam3_segmentation_service import FalSam3SegmentationService
from infrastructure.services.ai.fallback_segmentation_service import FallbackSegmentationService
from infrastructure.services.ai.modal_photoreal_render_service import ModalPhotorealRenderService
from infrastructure.services.imaging.opencv_image_inspection_service import (
    OpenCvImageInspectionService,
)
from infrastructure.services.imaging.opencv_preview_render_service import (
    OpenCvPreviewRenderService,
)
from infrastructure.services.imaging.opencv_surface_measurement_service import (
    OpenCvSurfaceMeasurementService,
)
from infrastructure.services.imaging.sample_house_provider import SampleHouseProvider
from infrastructure.services.report.reportlab_report_service import ReportLabReportService
from infrastructure.services.security.bcrypt_password_hasher import BcryptPasswordHasher
from infrastructure.services.security.jwt_token_service import JwtTokenService
from infrastructure.services.storage.local_file_storage_service import LocalFileStorageService

SWATCH_SIZE_PX = 160


@dataclass(frozen=True)
class InfrastructureConfig:
    database_url: str
    storage_dir: Path
    jwt_secret: str
    jwt_expiry_days: int
    max_upload_mb: int
    fal_api_key: str
    fal_segmentation_model: str
    fal_render_model: str
    fal_timeout_seconds: float
    daily_render_limit: int
    modal_render_url: str
    modal_render_token: str
    modal_render_timeout_seconds: float
    anthropic_api_key: str
    anthropic_gateway_url: str
    anthropic_model: str
    anthropic_timeout_seconds: float


@dataclass(frozen=True)
class InfrastructureRegistry:
    engine: Engine
    storage_root: Path
    user_repo: IUserRepository
    project_repo: IProjectRepository
    design_repo: IDesignRepository
    material_repo: IMaterialRepository
    knowledge_repo: IKnowledgeRepository
    storage: IFileStorageService
    password_hasher: IPasswordHasher
    token_service: ITokenService
    inspection: IImageInspectionService
    vision: IVisionCheckService
    segmentation: ISegmentationService
    measurement: ISurfaceMeasurementService
    preview: IPreviewRenderService
    photoreal: IPhotorealRenderService
    sample_house: ISampleHouseProvider
    report: IReportService
    advisor_model: IAdvisorLanguageModel


def build_registry(config: InfrastructureConfig) -> InfrastructureRegistry:
    engine = create_database_engine(config.database_url)
    create_schema(engine)
    session_factory = create_session_factory(engine)

    storage = LocalFileStorageService(config.storage_dir)
    material_repo = JsonMaterialRepository()
    preview = OpenCvPreviewRenderService()
    fal_client = FalClient(config.fal_api_key, config.fal_timeout_seconds)
    claude = build_anthropic_client(
        config.anthropic_api_key, config.anthropic_gateway_url, config.anthropic_timeout_seconds
    )
    # A dedicated segmentation model is preferred; a vision LLM is the fallback.
    segmentation = FallbackSegmentationService(
        [
            FalSam3SegmentationService(fal_client, config.fal_segmentation_model),
            AnthropicVisionSegmentationService(claude, config.anthropic_model),
        ]
    )

    # Exterio's own renderer on Modal is preferred when configured; fal.ai is the alternative.
    modal_photoreal = ModalPhotorealRenderService(
        config.modal_render_url,
        config.modal_render_token,
        config.modal_render_timeout_seconds,
        config.daily_render_limit,
    )
    photoreal: IPhotorealRenderService = (
        modal_photoreal
        if modal_photoreal.is_available()
        else FalPhotorealRenderService(
            fal_client, config.fal_render_model, config.daily_render_limit
        )
    )

    # Catalogue swatches are generated once at start-up from the same textures the preview uses.
    for material in material_repo.find_all():
        storage.save(swatch_path(material.id), preview.swatch(material, SWATCH_SIZE_PX))

    return InfrastructureRegistry(
        engine=engine,
        storage_root=storage.root,
        user_repo=UserRepository(session_factory),
        project_repo=ProjectRepository(session_factory),
        design_repo=DesignRepository(session_factory),
        material_repo=material_repo,
        knowledge_repo=TfidfKnowledgeRepository(),
        storage=storage,
        password_hasher=BcryptPasswordHasher(),
        token_service=JwtTokenService(config.jwt_secret, config.jwt_expiry_days),
        inspection=OpenCvImageInspectionService(config.max_upload_mb),
        vision=AnthropicVisionCheckService(claude, config.anthropic_model),
        segmentation=segmentation,
        measurement=OpenCvSurfaceMeasurementService(),
        preview=preview,
        photoreal=photoreal,
        sample_house=SampleHouseProvider(),
        report=ReportLabReportService(),
        advisor_model=AnthropicAdvisorLanguageModel(claude, config.anthropic_model),
    )
