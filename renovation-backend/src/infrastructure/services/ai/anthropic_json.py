"""Shared Claude plumbing: client construction and schema-constrained JSON requests.

The request asks for a JSON schema through structured outputs, which
Anthropic's API enforces. Some Anthropic-compatible gateways accept the
parameter but ignore it, so the reply is also parsed leniently (code fences
and surrounding prose are tolerated) and validated by the caller.
"""

import base64
import json
from typing import Any

import anthropic
from anthropic.types import ImageBlockParam, TextBlockParam

from domain.errors.project_errors import AiProviderError

MAX_TOKENS = 16000
JSON_ONLY_SUFFIX = (
    "\n\nRespond with a single JSON object that matches the required schema and nothing else: "
    "no prose, no markdown, no code fences."
)


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


def extract_json_object(text: str) -> dict[str, Any]:
    """Pull the first JSON object out of a model reply."""
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("No JSON object in the model reply")
    parsed = json.loads(text[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("The model reply is not a JSON object")
    return parsed


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
        raise AiProviderError("The AI model declined to analyse this photo.")
    text = "".join(block.text for block in response.content if block.type == "text")
    try:
        return extract_json_object(text)
    except ValueError as error:
        raise AiProviderError("The AI model returned an unreadable answer. Try again.") from error
