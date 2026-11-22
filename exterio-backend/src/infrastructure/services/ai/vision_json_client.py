"""One question about a photo, answered as a JSON object, by whichever vision model is configured.

The photo check and region detection share their prompts, schemas and answer validation; only
this call differs between providers. Implementations raise the errors below, so callers can
tell a busy provider from an unreachable one or an unreadable answer without knowing which
provider it was.
"""

import json
from abc import ABC, abstractmethod
from collections.abc import Iterator
from typing import Any

from domain.errors.project_errors import AiProviderError

UNREADABLE_ANSWER = "The AI model returned an unreadable answer. Try again."

JSON_ONLY_SUFFIX = (
    "\n\nRespond with a single JSON object that matches the required schema and nothing else: "
    "no prose, no markdown, no code fences."
)


def extract_json_object(text: str) -> dict[str, Any]:
    """Pull the first JSON object out of a model reply (code fences and prose are tolerated)."""
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("No JSON object in the model reply")
    parsed = json.loads(text[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("The model reply is not a JSON object")
    return parsed


class LlmBusyError(AiProviderError):
    """The provider is rate limiting; trying again later should work."""


class LlmUnreachableError(AiProviderError):
    """The provider could not be reached (network, timeout)."""


class LlmUnreadableError(AiProviderError):
    """The provider answered, but not with a usable JSON object, or declined to answer."""


class VisionJsonClient(ABC):
    @abstractmethod
    def is_available(self) -> bool: ...

    @abstractmethod
    def request_json(self, image: bytes, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        """Asks `prompt` about a JPEG and returns the reply as a JSON object.

        Raises LlmBusyError, LlmUnreachableError, LlmUnreadableError, or AiProviderError for
        any other provider failure.
        """

    def stream_json_text(self, image: bytes, prompt: str, schema: dict[str, Any]) -> Iterator[str]:
        """The same answer as JSON text, in pieces as the model writes it.

        Raises the same errors as `request_json`. Providers that cannot stream give the whole
        answer as one piece.
        """
        yield json.dumps(self.request_json(image, prompt, schema))
