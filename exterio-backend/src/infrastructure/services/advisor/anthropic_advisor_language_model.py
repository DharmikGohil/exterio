"""Generation side of the material advisor, using Claude."""

from collections.abc import Iterator

import anthropic
from anthropic.types.beta import BetaMessageParam

from domain.errors.project_errors import AiProviderError
from domain.interfaces.dtos.advisor_dto import ChatMessageDTO
from domain.interfaces.services.advisor_service import IAdvisorLanguageModel
from infrastructure.utils.logger import logger

MAX_TOKENS = 16000
FALLBACK_BETA = "server-side-fallback-2026-07-01"
ALLOWED_ROLES = frozenset({"user", "assistant"})


class AnthropicAdvisorLanguageModel(IAdvisorLanguageModel):
    def __init__(self, client: anthropic.Anthropic | None, model: str) -> None:
        self._client = client
        self._model = model

    def is_available(self) -> bool:
        return self._client is not None

    def stream(self, system_prompt: str, messages: list[ChatMessageDTO]) -> Iterator[str]:
        if self._client is None:
            raise AiProviderError("The material advisor is not configured")
        history = [self._to_param(message) for message in messages if message.role in ALLOWED_ROLES]
        wrote_text = False
        try:
            # Server-side fallbacks re-run a declined request on another model in the
            # same call, so a rare false-positive refusal does not surface to the user.
            with self._client.beta.messages.stream(
                model=self._model,
                max_tokens=MAX_TOKENS,
                system=system_prompt,
                betas=[FALLBACK_BETA],
                fallbacks="default",
                output_config={"effort": "low"},
                messages=history,
            ) as response:
                for text in response.text_stream:
                    wrote_text = wrote_text or bool(text.strip())
                    yield text
                final = response.get_final_message()
        except anthropic.RateLimitError as error:
            raise AiProviderError("The advisor is busy. Try again in a minute.") from error
        except anthropic.APIStatusError as error:
            logger.warning("Advisor failed: API status %s", error.status_code)
            raise AiProviderError("The advisor could not answer right now.") from error
        except anthropic.APIConnectionError as error:
            raise AiProviderError("The advisor could not be reached.") from error

        if final.stop_reason == "refusal":
            raise AiProviderError("The advisor could not answer that question.")
        if not wrote_text:
            raise AiProviderError("The advisor returned an empty answer.")

    @staticmethod
    def _to_param(message: ChatMessageDTO) -> BetaMessageParam:
        if message.role == "assistant":
            return {"role": "assistant", "content": message.content}
        return {"role": "user", "content": message.content}
