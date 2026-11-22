"""Generation side of the material advisor, using Gemini on Vertex AI.

The answer is streamed as the model writes it, so the panel fills in word by word.
"""

from collections.abc import Iterator

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from domain.errors.project_errors import AiProviderError
from domain.interfaces.dtos.advisor_dto import ChatMessageDTO
from domain.interfaces.services.advisor_service import IAdvisorLanguageModel
from infrastructure.services.ai.gemini_client import is_blocked, reply_text, translate_error
from infrastructure.services.ai.vision_json_client import LlmBusyError, LlmUnreachableError

MAX_OUTPUT_TOKENS = 8192
ALLOWED_ROLES = frozenset({"user", "assistant"})


class GeminiAdvisorLanguageModel(IAdvisorLanguageModel):
    def __init__(self, client: genai.Client | None, model: str) -> None:
        self._client = client
        self._model = model

    def is_available(self) -> bool:
        return self._client is not None

    def stream(self, system_prompt: str, messages: list[ChatMessageDTO]) -> Iterator[str]:
        if self._client is None:
            raise AiProviderError("The material advisor is not configured")
        contents = [
            types.Content(
                role="model" if message.role == "assistant" else "user",
                parts=[types.Part.from_text(text=message.content)],
            )
            for message in messages
            if message.role in ALLOWED_ROLES
        ]
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=MAX_OUTPUT_TOKENS,
            # Advice is short and grounded in the notes it is given; deep thinking only adds wait.
            thinking_config=types.ThinkingConfig(thinking_level=types.ThinkingLevel.LOW),
        )
        wrote_text = False
        try:
            for chunk in self._client.models.generate_content_stream(
                model=self._model, contents=contents, config=config
            ):
                if is_blocked(chunk):
                    raise AiProviderError("The advisor could not answer that question.")
                text = reply_text(chunk)
                if text:
                    wrote_text = wrote_text or bool(text.strip())
                    yield text
        except (genai_errors.APIError, httpx.HTTPError, OSError) as error:
            translated = translate_error(error, "The advisor")
            if isinstance(translated, LlmBusyError):
                raise AiProviderError("The advisor is busy. Try again in a minute.") from error
            if isinstance(translated, LlmUnreachableError):
                raise AiProviderError("The advisor could not be reached.") from error
            raise AiProviderError("The advisor could not answer right now.") from error
        if not wrote_text:
            raise AiProviderError("The advisor returned an empty answer.")
