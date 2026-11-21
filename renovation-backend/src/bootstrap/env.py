"""Environment configuration. The only place that reads environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from infrastructure.registry import InfrastructureConfig

DEV_JWT_SECRET = "dev-only-secret-change-me-in-production-0123456789"
PRODUCTION = "production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    port: int = 8000
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    database_url: str = "sqlite:///./data/app.db"
    storage_dir: Path = Path("./data/files")

    jwt_secret: str = DEV_JWT_SECRET
    jwt_expiry_days: int = 14
    max_upload_mb: int = Field(default=15, ge=1, le=40)

    # A shared reviewer sign-in, shown on the sign-in page and seeded with the sample house.
    # Leave the email empty to switch it off.
    demo_account_email: str = "demo@example.com"
    demo_account_password: str = "review-2026"

    fal_key: str = ""
    fal_segmentation_model: str = "fal-ai/sam-3/image"
    fal_render_model: str = "fal-ai/nano-banana/edit"
    fal_timeout_seconds: float = 120.0
    daily_render_limit: int = 10

    anthropic_api_key: str = ""
    # Optional Anthropic-compatible endpoint. Empty means Anthropic's own API.
    anthropic_gateway_url: str = ""
    anthropic_model: str = "claude-opus-5-5"
    anthropic_timeout_seconds: float = 150.0

    @property
    def has_demo_account(self) -> bool:
        return bool(self.demo_account_email.strip())

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_for_environment(self) -> None:
        if self.app_env == PRODUCTION and self.jwt_secret == DEV_JWT_SECRET:
            raise RuntimeError("JWT_SECRET must be set to a private value in production")

    def to_infrastructure_config(self) -> InfrastructureConfig:
        return InfrastructureConfig(
            database_url=self.database_url,
            storage_dir=self.storage_dir,
            jwt_secret=self.jwt_secret,
            jwt_expiry_days=self.jwt_expiry_days,
            max_upload_mb=self.max_upload_mb,
            fal_api_key=self.fal_key,
            fal_segmentation_model=self.fal_segmentation_model,
            fal_render_model=self.fal_render_model,
            fal_timeout_seconds=self.fal_timeout_seconds,
            daily_render_limit=self.daily_render_limit,
            anthropic_api_key=self.anthropic_api_key,
            anthropic_gateway_url=self.anthropic_gateway_url,
            anthropic_model=self.anthropic_model,
            anthropic_timeout_seconds=self.anthropic_timeout_seconds,
        )


@lru_cache
def load_settings() -> Settings:
    settings = Settings()
    settings.validate_for_environment()
    return settings
