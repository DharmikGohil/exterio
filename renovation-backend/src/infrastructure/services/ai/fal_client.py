"""Minimal client for fal.ai's synchronous model endpoints."""

import base64
from typing import Any

import httpx

from domain.errors.project_errors import AiProviderError
from infrastructure.utils.logger import logger

FAL_RUN_URL = "https://fal.run"
DATA_URI_PREFIX = "data:"


def to_data_uri(data: bytes, media_type: str = "image/jpeg") -> str:
    return f"data:{media_type};base64,{base64.b64encode(data).decode('ascii')}"


class FalClient:
    def __init__(self, api_key: str, timeout_seconds: float) -> None:
        self._api_key = api_key
        self._timeout = timeout_seconds

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)

    def run(self, model: str, payload: dict[str, Any]) -> dict[str, Any]:
        headers = {"Authorization": f"Key {self._api_key}", "Content-Type": "application/json"}
        try:
            response = httpx.post(
                f"{FAL_RUN_URL}/{model}", json=payload, headers=headers, timeout=self._timeout
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as error:
            logger.warning(
                "fal %s failed: %s %s", model, error.response.status_code, error.response.text[:300]
            )
            raise AiProviderError(
                "The AI image service rejected the request. Try again."
            ) from error
        except httpx.HTTPError as error:
            logger.warning("fal %s unreachable: %s", model, error)
            raise AiProviderError(
                "The AI image service did not respond in time. Try again."
            ) from error
        body: dict[str, Any] = response.json()
        return body

    def fetch(self, url: str) -> bytes:
        """Download a result file. fal returns either a hosted URL or an inline data URI."""
        if url.startswith(DATA_URI_PREFIX):
            return base64.b64decode(url.split(",", 1)[1])
        try:
            response = httpx.get(url, timeout=self._timeout, follow_redirects=True)
            response.raise_for_status()
        except httpx.HTTPError as error:
            raise AiProviderError("Could not download the AI result. Try again.") from error
        return response.content
