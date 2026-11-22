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
from infrastructure.services.advisor.gemini_advisor_language_model import (
    GeminiAdvisorLanguageModel,
)
from infrastructure.services.ai.anthropic_json import (
    AnthropicVisionJsonClient,
    build_anthropic_client,
)
from infrastructure.services.ai.fal_client import FalClient
from infrastructure.services.ai.fal_photoreal_render_service import FalPhotorealRenderService
from infrastructure.services.ai.fal_sam3_segmentation_service import FalSam3SegmentationService
from infrastructure.services.ai.fallback_photoreal_render_service import (
    FallbackPhotorealRenderService,
)
from infrastructure.services.ai.fallback_segmentation_service import FallbackSegmentationService
from infrastructure.services.ai.gemini_client import GeminiVisionJsonClient, build_gemini_client
from infrastructure.services.ai.gemini_photoreal_render_service import (
    GeminiPhotorealRenderService,
)
from infrastructure.services.ai.modal_photoreal_render_service import ModalPhotorealRenderService
from infrastructure.services.ai.vision_json_client import VisionJsonClient
from infrastructure.services.ai.vision_llm_check_service import VisionLlmCheckService
from infrastructure.services.ai.vision_llm_segmentation_service import (
    VisionLlmSegmentationService,
)
from infrastructure.services.imaging.opencv_image_inspection_service import (
    OpenCvImageInspectionService,
)
from infrastructure.services.imaging.opencv_preview_render_service import (
    OpenCvPreviewRenderService,
)
from infrastructure.services.imaging.opencv_surface_measurement_service import (
    OpenCvSurfaceMeasurementService,
)
from infrastructure.services.imaging.photo_sample_house_provider import PhotoSampleHouseProvider
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
    anthropic_detection_timeout_seconds: float = 60.0
    google_vertex_credentials: str = ""
    google_vertex_location: str = "global"
    gemini_model: str = "gemini-3-flash-preview"
    gemini_detection_model: str = "gemini-3.1-pro-preview"
    gemini_timeout_seconds: float = 150.0
    photoreal_renderer: str = "gemini"
    gemini_image_model: str = "gemini-2.5-flash-image"


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
    language = _build_language_models(config)
    # A dedicated segmentation model is preferred; then the vision LLMs, best first. Each one is
    # asked only if the one before is not configured or fails before finding any part.
    segmentation = FallbackSegmentationService(
        [
            FalSam3SegmentationService(fal_client, config.fal_segmentation_model),
            *(VisionLlmSegmentationService(client) for client in language.detection),
        ]
    )

    photoreal = _build_photoreal(config, fal_client)

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
        vision=VisionLlmCheckService(language.vision),
        segmentation=segmentation,
        measurement=OpenCvSurfaceMeasurementService(),
        preview=preview,
        photoreal=photoreal,
        sample_house=PhotoSampleHouseProvider(),
        report=ReportLabReportService(),
        advisor_model=language.advisor,
    )


@dataclass(frozen=True)
class _LanguageModels:
    vision: VisionJsonClient
    # Best first; the next one is asked when the one before fails before finding any part.
    detection: tuple[VisionJsonClient, ...]
    advisor: IAdvisorLanguageModel


def _build_language_models(config: InfrastructureConfig) -> _LanguageModels:
    """Each job on the model that measured best at it, among those configured.

    - Outlining parts: Claude first. On the four hand-traced sample houses
      (`scripts/benchmark_detection.py`) it matched the traced walls with IoU 0.88 against
      Gemini 3.1 Pro's 0.78, found 74% of the traced parts against 57%, and drew less on
      neighbouring buildings. Gemini 3.1 Pro is the backup: it is asked when no Claude key is
      set, or when Claude fails before sending a part. Claude gets a short wait for this job
      (`anthropic_detection_timeout_seconds`) and no automatic retries, so a dead endpoint hands
      over to Gemini in about a minute instead of hanging for several.
    - Photo check and advisor: Gemini first. It answers in a few seconds and streams the advice
      word by word; these jobs need judgement, not geometry. Claude is the fallback.
    """
    gemini = build_gemini_client(
        config.google_vertex_credentials,
        config.google_vertex_location,
        config.gemini_timeout_seconds,
    )
    claude = build_anthropic_client(
        config.anthropic_api_key, config.anthropic_gateway_url, config.anthropic_timeout_seconds
    )
    claude_detection = build_anthropic_client(
        config.anthropic_api_key,
        config.anthropic_gateway_url,
        config.anthropic_detection_timeout_seconds,
        max_retries=0,
    )
    claude_json = AnthropicVisionJsonClient(claude, config.anthropic_model)
    claude_detection_json = AnthropicVisionJsonClient(claude_detection, config.anthropic_model)
    if gemini is None:
        return _LanguageModels(
            vision=claude_json,
            detection=(claude_detection_json,),
            advisor=AnthropicAdvisorLanguageModel(claude, config.anthropic_model),
        )
    gemini_detection_json = GeminiVisionJsonClient(gemini, config.gemini_detection_model)
    return _LanguageModels(
        vision=GeminiVisionJsonClient(gemini, config.gemini_model),
        detection=(
            (claude_detection_json, gemini_detection_json)
            if claude_detection is not None
            else (gemini_detection_json,)
        ),
        advisor=GeminiAdvisorLanguageModel(gemini, config.gemini_model),
    )


def _build_photoreal(
    config: InfrastructureConfig, fal_client: FalClient
) -> IPhotorealRenderService:
    """Gemini's image model first (the most realistic), then Exterio's SDXL renderer on Modal,
    then fal.ai, each used when the one before is not configured or fails. With
    PHOTOREAL_RENDERER=modal, Modal goes first and Gemini last."""
    gemini = GeminiPhotorealRenderService(
        build_gemini_client(
            config.google_vertex_credentials,
            config.google_vertex_location,
            config.gemini_timeout_seconds,
        ),
        config.gemini_image_model,
        config.daily_render_limit,
    )
    modal = ModalPhotorealRenderService(
        config.modal_render_url,
        config.modal_render_token,
        config.modal_render_timeout_seconds,
        config.daily_render_limit,
    )
    fal = FalPhotorealRenderService(fal_client, config.fal_render_model, config.daily_render_limit)
    order: list[IPhotorealRenderService] = (
        [modal, fal, gemini] if config.photoreal_renderer == "modal" else [gemini, modal, fal]
    )
    return FallbackPhotorealRenderService(order)
