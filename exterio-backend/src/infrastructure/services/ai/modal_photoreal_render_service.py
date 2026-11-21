"""Photoreal pass on Exterio's own SDXL + ControlNet renderer, deployed on Modal.

See `exterio-render/` for the GPU side. This client sends the instant preview and a short
diffusion prompt, and gets a JPEG back.
"""

import base64

import httpx

from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import IPhotorealRenderService, RenderFinish
from domain.prompts.photoreal_render_prompt import build_diffusion_prompt
from infrastructure.utils.logger import logger

JPEG_MEDIA_TYPE = "image/jpeg"


class ModalPhotorealRenderService(IPhotorealRenderService):
    def __init__(
        self,
        endpoint_url: str,
        token: str,
        timeout_seconds: float,
        daily_limit: int,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._endpoint_url = endpoint_url.strip()
        self._token = token.strip()
        self._timeout = timeout_seconds
        self._daily_limit = daily_limit
        self._transport = transport

    def is_available(self) -> bool:
        return bool(self._endpoint_url and self._token)

    def daily_limit(self) -> int:
        return self._daily_limit

    def render(self, composite: bytes, finishes: tuple[RenderFinish, ...]) -> bytes:
        prompt = build_diffusion_prompt(finishes)
        payload = {
            "image_base64": base64.b64encode(composite).decode("ascii"),
            "prompt": prompt.prompt,
            "negative_prompt": prompt.negative_prompt,
        }
        try:
            with httpx.Client(timeout=self._timeout, transport=self._transport) as client:
                response = client.post(
                    self._endpoint_url,
                    json=payload,
                    headers={"Authorization": f"Bearer {self._token}"},
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as error:
            logger.warning(
                "Modal render failed: %s %s",
                error.response.status_code,
                error.response.text[:300],
            )
            raise AiProviderError(
                "The photoreal renderer rejected the request. Try again."
            ) from error
        except httpx.HTTPError as error:
            logger.warning("Modal render unreachable: %s", error)
            raise AiProviderError(
                "The photoreal renderer did not respond in time. Try again."
            ) from error

        if not response.headers.get("content-type", "").startswith(JPEG_MEDIA_TYPE):
            raise AiProviderError("The photoreal renderer returned something other than an image.")
        if not response.content:
            raise AiProviderError("The AI render came back empty. Try again.")
        return response.content
