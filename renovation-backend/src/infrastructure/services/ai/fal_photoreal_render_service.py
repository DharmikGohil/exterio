"""Photoreal pass using an instruction-based image-edit model hosted on fal.ai."""

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import IPhotorealRenderService
from infrastructure.services.ai.fal_client import FalClient, to_data_uri


class FalPhotorealRenderService(IPhotorealRenderService):
    def __init__(self, client: FalClient, model: str, daily_limit: int) -> None:
        self._client = client
        self._model = model
        self._daily_limit = daily_limit

    def is_available(self) -> bool:
        return self._client.is_configured

    def daily_limit(self) -> int:
        return self._daily_limit

    def render(self, composite: bytes, prompt: str) -> bytes:
        result = self._client.run(
            self._model,
            {
                "prompt": prompt,
                "image_urls": [to_data_uri(composite)],
                "num_images": 1,
                "output_format": "jpeg",
            },
        )
        images = result.get("images") or []
        if not images or not images[0].get("url"):
            raise AiProviderError("The AI render came back empty. Try again.")
        return self._client.fetch(images[0]["url"])
