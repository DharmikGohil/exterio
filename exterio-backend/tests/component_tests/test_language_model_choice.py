import pytest

from bootstrap.env import Settings
from infrastructure import registry
from infrastructure.services.advisor.anthropic_advisor_language_model import (
    AnthropicAdvisorLanguageModel,
)
from infrastructure.services.advisor.gemini_advisor_language_model import (
    GeminiAdvisorLanguageModel,
)
from infrastructure.services.ai.anthropic_json import AnthropicVisionJsonClient
from infrastructure.services.ai.gemini_client import GeminiVisionJsonClient


@pytest.fixture
def config(tmp_path):
    return Settings(_env_file=None, storage_dir=tmp_path).to_infrastructure_config()


def _choose(monkeypatch, config, *, gemini: bool, claude: bool):
    monkeypatch.setattr(registry, "build_gemini_client", lambda *_: object() if gemini else None)
    monkeypatch.setattr(registry, "build_anthropic_client", lambda *_: object() if claude else None)
    return registry._build_language_models(config)


def test_with_both_keys_claude_outlines_parts_and_gemini_checks_and_advises(monkeypatch, config):
    actual = _choose(monkeypatch, config, gemini=True, claude=True)

    assert isinstance(actual.detection, AnthropicVisionJsonClient), (
        "Claude measured best at outlines"
    )
    assert isinstance(actual.vision, GeminiVisionJsonClient)
    assert isinstance(actual.advisor, GeminiAdvisorLanguageModel)


def test_with_only_gemini_it_does_everything(monkeypatch, config):
    actual = _choose(monkeypatch, config, gemini=True, claude=False)

    assert isinstance(actual.detection, GeminiVisionJsonClient)
    assert isinstance(actual.advisor, GeminiAdvisorLanguageModel)


def test_with_only_claude_it_does_everything(monkeypatch, config):
    actual = _choose(monkeypatch, config, gemini=False, claude=True)

    assert isinstance(actual.detection, AnthropicVisionJsonClient)
    assert isinstance(actual.vision, AnthropicVisionJsonClient)
    assert isinstance(actual.advisor, AnthropicAdvisorLanguageModel)
