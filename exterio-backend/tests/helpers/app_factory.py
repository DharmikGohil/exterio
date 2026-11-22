"""Builds the real application on an in-memory database with fake AI providers."""

from collections.abc import Iterator
from dataclasses import replace
from pathlib import Path

from fastapi.testclient import TestClient

from bootstrap.app import create_app
from bootstrap.env import Settings
from domain.entities.region_entity import RegionLabel
from domain.interfaces.dtos.advisor_dto import ChatMessageDTO
from domain.interfaces.services.advisor_service import IAdvisorLanguageModel
from domain.interfaces.services.image_services import (
    DetectedRegion,
    IPhotorealRenderService,
    ISegmentationService,
    RenderFinish,
)
from infrastructure.registry import build_registry


class FakeSegmentationService(ISegmentationService):
    def is_available(self) -> bool:
        return True

    def detect(self, image: bytes, width: int, height: int) -> list[DetectedRegion]:
        wall = ((100.0, 100.0), (900.0, 100.0), (900.0, 700.0), (100.0, 700.0))
        door = ((450.0, 490.0), (550.0, 490.0), (550.0, 700.0), (450.0, 700.0))
        pillar = ((200.0, 300.0), (240.0, 300.0), (240.0, 700.0), (200.0, 700.0))
        return [
            DetectedRegion(RegionLabel.WALL, wall, 0.9),
            DetectedRegion(RegionLabel.DOOR, door, 0.9),
            DetectedRegion(RegionLabel.PILLAR, pillar, 0.8),
        ]


class FakePhotorealRenderService(IPhotorealRenderService):
    def __init__(self, daily_limit: int = 2) -> None:
        self._daily_limit = daily_limit
        self.finishes: list[tuple[RenderFinish, ...]] = []

    def is_available(self) -> bool:
        return True

    def daily_limit(self) -> int:
        return self._daily_limit

    def render(self, composite: bytes, finishes: tuple[RenderFinish, ...]) -> bytes:
        self.finishes.append(finishes)
        return composite


class FakeAdvisorLanguageModel(IAdvisorLanguageModel):
    def __init__(self) -> None:
        self.system_prompts: list[str] = []

    def is_available(self) -> bool:
        return True

    def stream(self, system_prompt: str, messages: list[ChatMessageDTO]) -> Iterator[str]:
        self.system_prompts.append(system_prompt)
        yield from ("Stone ", "suits the ", "pillars best.")


def build_test_client(
    storage_dir: Path, with_ai: bool = False, demo_account_email: str = ""
) -> tuple[TestClient, dict[str, object]]:
    settings = Settings(
        _env_file=None,
        database_url="sqlite:///:memory:",
        storage_dir=storage_dir,
        fal_key="",
        anthropic_api_key="",
        demo_account_email=demo_account_email,
    )
    registry = build_registry(settings.to_infrastructure_config())
    fakes: dict[str, object] = {}
    if with_ai:
        fakes = {
            "segmentation": FakeSegmentationService(),
            "photoreal": FakePhotorealRenderService(),
            "advisor_model": FakeAdvisorLanguageModel(),
        }
        registry = replace(registry, **fakes)
    return TestClient(create_app(settings, registry)), fakes


def guest_headers(client: TestClient) -> dict[str, str]:
    token = client.post("/api/auth/guest").json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}
