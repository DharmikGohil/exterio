"""Claude plumbing: client construction and schema-constrained JSON requests about a photo.

The request asks for a JSON schema through structured outputs, which
Anthropic's API enforces. Some Anthropic-compatible gateways accept the
parameter but ignore it, so the reply is also parsed leniently (code fences
and surrounding prose are tolerated) and validated by the caller.
"""

import base64
from collections.abc import Iterator
from typing import Any

import anthropic
from anthropic.types import ImageBlockParam, TextBlockParam

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

MAX_TOKENS = 16000


def build_anthropic_client(
    api_key: str, base_url: str, timeout_seconds: float
) -> anthropic.Anthropic | None:
    """A client for Anthropic's API, or for a compatible gateway when a base URL is given."""
    if not api_key:
        return None
    return anthropic.Anthropic(api_key=api_key, base_url=base_url or None, timeout=timeout_seconds)


def jpeg_block(image: bytes) -> ImageBlockParam:
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": base64.standard_b64encode(image).decode("utf-8"),
        },
    }


def request_json(
    client: anthropic.Anthropic,
    model: str,
    image: bytes,
    prompt: str,
    schema: dict[str, Any],
) -> dict[str, Any]:
    """Ask a question about an image and get back a JSON object.

    Raises anthropic errors for transport problems and AiProviderError when
    the model declines or the reply cannot be read as JSON.
    """
    text_block: TextBlockParam = {"type": "text", "text": prompt + JSON_ONLY_SUFFIX}
    response = client.messages.create(
        model=model,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": [jpeg_block(image), text_block]}],
        output_config={"format": {"type": "json_schema", "schema": schema}},
    )
    if response.stop_reason == "refusal":
        raise LlmUnreadableError("The AI model declined to analyse this photo.")
    text = "".join(block.text for block in response.content if block.type == "text")
    try:
        return extract_json_object(text)
    except ValueError as error:
        raise LlmUnreadableError(UNREADABLE_ANSWER) from error


class AnthropicVisionJsonClient(VisionJsonClient):
    """`VisionJsonClient` on Claude, through Anthropic's API or a compatible gateway."""

    def __init__(self, client: anthropic.Anthropic | None, model: str) -> None:
        self._client = client
        self._model = model

    def is_available(self) -> bool:
        return self._client is not None

    def request_json(self, image: bytes, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        if self._client is None:
            raise AiProviderError("The vision model is not configured")
        try:
            return request_json(self._client, self._model, image, prompt, schema)
        except anthropic.RateLimitError as error:
            raise LlmBusyError("The AI model is busy. Try again in a minute.") from error
        except anthropic.APIStatusError as error:
            logger.warning("Vision request failed: API status %s", error.status_code)
            raise AiProviderError("The AI model could not answer. Try again.") from error
        except anthropic.APIConnectionError as error:
            raise LlmUnreachableError("The AI model could not be reached.") from error

    def stream_json_text(self, image: bytes, prompt: str, schema: dict[str, Any]) -> Iterator[str]:
        if self._client is None:
            raise AiProviderError("The vision model is not configured")
        text_block: TextBlockParam = {"type": "text", "text": prompt + JSON_ONLY_SUFFIX}
        try:
            with self._client.messages.stream(
                model=self._model,
                max_tokens=MAX_TOKENS,
                messages=[{"role": "user", "content": [jpeg_block(image), text_block]}],
                output_config={"format": {"type": "json_schema", "schema": schema}},
            ) as response:
                yield from response.text_stream
                final = response.get_final_message()
        except anthropic.RateLimitError as error:
            raise LlmBusyError("The AI model is busy. Try again in a minute.") from error
        except anthropic.APIStatusError as error:
            logger.warning("Vision stream failed: API status %s", error.status_code)
            raise AiProviderError("The AI model could not answer. Try again.") from error
        except anthropic.APIConnectionError as error:
            raise LlmUnreachableError("The AI model could not be reached.") from error
        if final.stop_reason == "refusal":
            raise LlmUnreadableError("The AI model declined to analyse this photo.")
