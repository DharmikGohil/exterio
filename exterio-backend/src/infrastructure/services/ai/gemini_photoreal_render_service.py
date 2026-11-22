"""Photoreal pass on Gemini's image-editing model, on Vertex AI.

Like the fal.ai pass, it is an instruction-following edit model, so it reads the full brief
(`build_render_prompt`), including what it must not change. The instant preview goes in; the
edited image comes back in the same call, at the model's own size. The render use case resizes
it to the photo and keeps the original pixels outside the refinished parts.
"""

import time
from collections.abc import Callable

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import IPhotorealRenderService, RenderFinish
from domain.prompts.photoreal_render_prompt import build_render_prompt
from infrastructure.services.ai.gemini_client import is_blocked, translate_error
from infrastructure.services.ai.vision_json_client import LlmBusyError

# The project allows only a few image requests a minute; a short wait usually clears it.
BUSY_RETRY_SECONDS = 5.0


class GeminiPhotorealRenderService(IPhotorealRenderService):
    def __init__(
        self,
        client: genai.Client | None,
        model: str,
        daily_limit: int,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self._client = client
        self._model = model
        self._daily_limit = daily_limit
        self._sleep = sleep

    def is_available(self) -> bool:
        return self._client is not None

    def daily_limit(self) -> int:
        return self._daily_limit

    def render(self, composite: bytes, finishes: tuple[RenderFinish, ...]) -> bytes:
        """Tries once more after a short wait when the model is busy."""
        try:
            return self._render_once(composite, finishes)
        except _BusyError:
            self._sleep(BUSY_RETRY_SECONDS)
            try:
                return self._render_once(composite, finishes)
            except _BusyError as error:
                raise AiProviderError("The photoreal renderer is busy. Try again soon.") from error

    def _render_once(self, composite: bytes, finishes: tuple[RenderFinish, ...]) -> bytes:
        if self._client is None:
            raise AiProviderError("The photoreal render is not configured")
        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=composite, mime_type="image/jpeg"),
                        types.Part.from_text(text=build_render_prompt(finishes)),
                    ],
                ),
                config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
            )
        except (genai_errors.APIError, httpx.HTTPError, OSError) as error:
            translated = translate_error(error, "The photoreal renderer")
            if isinstance(translated, LlmBusyError):
                raise _BusyError("The photoreal renderer is busy.") from error
            raise AiProviderError("The photoreal render failed. Try again.") from error
        if is_blocked(response):
            raise AiProviderError("The photoreal renderer declined this image.")
        content = response.candidates[0].content if response.candidates else None
        for part in (content.parts if content else None) or []:
            if part.inline_data is not None and part.inline_data.data:
                return part.inline_data.data
        raise AiProviderError("The AI render came back empty. Try again.")


class _BusyError(AiProviderError):
    """The model is rate limiting this request."""
