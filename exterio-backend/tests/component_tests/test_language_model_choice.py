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
    monkeypatch.setattr(
        registry, "build_anthropic_client", lambda *_, **__: object() if claude else None
    )
    return registry._build_language_models(config)


def test_with_both_keys_claude_outlines_parts_and_gemini_checks_and_advises(monkeypatch, config):
    actual = _choose(monkeypatch, config, gemini=True, claude=True)

    assert [type(client) for client in actual.detection] == [
        AnthropicVisionJsonClient,
        GeminiVisionJsonClient,
    ], "Claude measured best at outlines; Gemini 3.1 Pro takes over if Claude fails"
    assert isinstance(actual.vision, GeminiVisionJsonClient)
    assert isinstance(actual.advisor, GeminiAdvisorLanguageModel)


def test_with_only_gemini_it_does_everything(monkeypatch, config):
    actual = _choose(monkeypatch, config, gemini=True, claude=False)

    assert [type(client) for client in actual.detection] == [GeminiVisionJsonClient]
    assert isinstance(actual.advisor, GeminiAdvisorLanguageModel)


def test_with_only_claude_it_does_everything(monkeypatch, config):
    actual = _choose(monkeypatch, config, gemini=False, claude=True)

    assert [type(client) for client in actual.detection] == [AnthropicVisionJsonClient]
    assert isinstance(actual.vision, AnthropicVisionJsonClient)
    assert isinstance(actual.advisor, AnthropicAdvisorLanguageModel)


def test_detection_gets_a_short_wait_and_no_retries_so_a_dead_endpoint_hands_over(
    monkeypatch, config
):
    calls = []

    def record(*args, **kwargs):
        calls.append((args, kwargs))
        return object()

    monkeypatch.setattr(registry, "build_gemini_client", lambda *_: object())
    monkeypatch.setattr(registry, "build_anthropic_client", record)

    registry._build_language_models(config)

    detection_calls = [kwargs for _, kwargs in calls if kwargs.get("max_retries") == 0]
    assert len(detection_calls) == 1
    assert calls[1][0][2] == config.anthropic_detection_timeout_seconds
    assert config.anthropic_detection_timeout_seconds < config.anthropic_timeout_seconds
