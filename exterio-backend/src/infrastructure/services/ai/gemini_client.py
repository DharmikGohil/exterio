"""Gemini on Google Cloud Vertex AI: the client, and `VisionJsonClient` on top of it.

Credentials are a service-account key. Locally the setting is the path to the key file; on a
host, where files are awkward, it can be the key's JSON itself. Either way the key stays out of
the repository.
"""

import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from google.oauth2 import service_account

from domain.errors.project_errors import AiProviderError
from infrastructure.services.ai.vision_json_client import (
    JSON_ONLY_SUFFIX,
    UNREADABLE_ANSWER,
    LlmBusyError,
    LlmUnreachableError,
    LlmUnreadableError,
    VisionJsonClient,
    extract_json_object,
)
from infrastructure.utils.logger import logger

CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform"
HTTP_TOO_MANY_REQUESTS = 429
BLOCKED_FINISH_REASONS = frozenset(
    {
        types.FinishReason.SAFETY,
        types.FinishReason.BLOCKLIST,
        types.FinishReason.PROHIBITED_CONTENT,
        types.FinishReason.IMAGE_SAFETY,
    }
)


def load_service_account_info(credentials: str) -> dict[str, Any]:
    """The key as a dict, from its JSON text or from the path of its file."""
    text = credentials.strip()
    if not text.startswith("{"):
        path = Path(text).expanduser()
        if not path.is_file():
            raise ValueError(f"GOOGLE_VERTEX_CREDENTIALS points to a missing file: {path}")
        text = path.read_text(encoding="utf-8")
    try:
        info = json.loads(text)
    except json.JSONDecodeError as error:
        raise ValueError("GOOGLE_VERTEX_CREDENTIALS is not a valid service-account key") from error
    if not isinstance(info, dict) or info.get("type") != "service_account":
        raise ValueError("GOOGLE_VERTEX_CREDENTIALS is not a service-account key")
    return info


def build_gemini_client(
    credentials: str, location: str, timeout_seconds: float
) -> genai.Client | None:
    """A Vertex AI client for the key's project, or None when no key is configured."""
    if not credentials.strip():
        return None
    info = load_service_account_info(credentials)
    scoped = service_account.Credentials.from_service_account_info(  # type: ignore[no-untyped-call]
        info, scopes=[CLOUD_PLATFORM_SCOPE]
    )
    return genai.Client(
        vertexai=True,
        project=info["project_id"],
        location=location,
        credentials=scoped,
        http_options=types.HttpOptions(timeout=int(timeout_seconds * 1000)),
    )


def reply_text(response: types.GenerateContentResponse) -> str:
    """The answer's text, without the model's thinking."""
    content = response.candidates[0].content if response.candidates else None
    if content is None:
        return ""
    return "".join(part.text for part in content.parts or [] if part.text and not part.thought)


def is_blocked(response: types.GenerateContentResponse) -> bool:
    if response.prompt_feedback is not None and response.prompt_feedback.block_reason:
        return True
    finish_reason = response.candidates[0].finish_reason if response.candidates else None
    return finish_reason is not None and finish_reason in BLOCKED_FINISH_REASONS


def translate_error(error: Exception, what: str) -> AiProviderError:
    """A Gemini or transport failure as the matching provider-neutral error."""
    if isinstance(error, genai_errors.ClientError) and error.code == HTTP_TOO_MANY_REQUESTS:
        return LlmBusyError(f"{what} is busy. Try again in a minute.")
    if isinstance(error, genai_errors.APIError):
        logger.warning("Gemini request failed: status %s", error.code)
        return AiProviderError(f"{what} could not answer right now.")
    return LlmUnreachableError(f"{what} could not be reached.")


class GeminiVisionJsonClient(VisionJsonClient):
    def __init__(self, client: genai.Client | None, model: str) -> None:
        self._client = client
        self._model = model

    def is_available(self) -> bool:
        return self._client is not None

    def request_json(self, image: bytes, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        if self._client is None:
            raise AiProviderError("The vision model is not configured")
        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=image, mime_type="image/jpeg"),
                        types.Part.from_text(text=prompt + JSON_ONLY_SUFFIX),
                    ],
                ),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_json_schema=schema,
                ),
            )
        except (genai_errors.APIError, httpx.HTTPError, OSError) as error:
            raise translate_error(error, "The AI model") from error
        if is_blocked(response):
            raise LlmUnreadableError("The AI model declined to analyse this photo.")
        try:
            return extract_json_object(reply_text(response))
        except ValueError as error:
            raise LlmUnreadableError(UNREADABLE_ANSWER) from error

    def stream_json_text(self, image: bytes, prompt: str, schema: dict[str, Any]) -> Iterator[str]:
        if self._client is None:
            raise AiProviderError("The vision model is not configured")
        try:
            for chunk in self._client.models.generate_content_stream(
                model=self._model,
                contents=types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=image, mime_type="image/jpeg"),
                        types.Part.from_text(text=prompt + JSON_ONLY_SUFFIX),
                    ],
                ),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_json_schema=schema,
                ),
            ):
                if is_blocked(chunk):
                    raise LlmUnreadableError("The AI model declined to analyse this photo.")
                text = reply_text(chunk)
                if text:
                    yield text
        except (genai_errors.APIError, httpx.HTTPError, OSError) as error:
            raise translate_error(error, "The AI model") from error
