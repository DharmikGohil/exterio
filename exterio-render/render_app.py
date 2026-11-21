"""Exterio photoreal renderer on Modal.

Takes the instant preview (the house with each chosen finish painted flat onto its region) and
returns a realistic version. SDXL img2img adds light, depth and texture, while a Canny-edge
ControlNet holds every edge of the building where it is. The API then pastes the original
photo back outside the edited regions, so nothing but the finishes can change.

Deploy:   modal deploy render_app.py
Secret:   modal secret create exterio-render-auth RENDER_TOKEN=<long random string>
"""

# FastAPI types below exist only in the container; keep annotations unevaluated locally.
from __future__ import annotations

import base64
import hmac
import io
import os

import modal

from render_sizing import fit_for_sdxl

APP_NAME = "exterio-render"
AUTH_SECRET_NAME = "exterio-render-auth"

BASE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
CONTROLNET_MODEL = "diffusers/controlnet-canny-sdxl-1.0"
# The stock SDXL VAE overflows in fp16 and returns black images; this one is fixed for fp16.
VAE_MODEL = "madebyollin/sdxl-vae-fp16-fix"
MODEL_CACHE = "/models"

# Realism without redesign: low strength keeps the planned colours, the ControlNet keeps edges.
# A request may tune both within these bounds; outside them SDXL starts inventing architecture.
# Tuned on a real house photo: 0.42 drew tile lines into plain paint; 0.25 and below changed
# nothing visible. 0.30 with a strong ControlNet adds light and texture and keeps every edge.
STRENGTH = 0.30
STRENGTH_RANGE = (0.15, 0.6)
CONTROLNET_SCALE = 1.0
CONTROLNET_SCALE_RANGE = (0.3, 1.2)
GUIDANCE_SCALE = 6.5
STEPS = 30
CANNY_LOW, CANNY_HIGH = 80, 180
JPEG_QUALITY = 92
MAX_IMAGE_BYTES = 12 * 1024 * 1024


def download_weights() -> None:
    """Runs once at image build time, so containers start with the weights on disk."""
    import torch
    from diffusers import AutoencoderKL, ControlNetModel, StableDiffusionXLControlNetImg2ImgPipeline

    controlnet = ControlNetModel.from_pretrained(CONTROLNET_MODEL, torch_dtype=torch.float16)
    vae = AutoencoderKL.from_pretrained(VAE_MODEL, torch_dtype=torch.float16)
    StableDiffusionXLControlNetImg2ImgPipeline.from_pretrained(
        BASE_MODEL,
        controlnet=controlnet,
        vae=vae,
        torch_dtype=torch.float16,
        variant="fp16",
        use_safetensors=True,
    )


image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("libgl1", "libglib2.0-0")
    .uv_pip_install(
        "torch==2.5.1",
        "diffusers==0.31.0",
        "transformers==4.46.3",
        "accelerate==1.1.1",
        "safetensors==0.4.5",
        "huggingface_hub==0.26.2",
        "opencv-python-headless==4.10.0.84",
        "pillow==11.0.0",
        "numpy==1.26.4",
        "fastapi[standard]==0.115.6",
    )
    .env({"HF_HUB_CACHE": MODEL_CACHE, "HF_HUB_ENABLE_HF_TRANSFER": "0"})
    # Copied in (not mounted) before the download step, because that step imports this module.
    .add_local_python_source("render_sizing", copy=True)
    .run_function(download_weights)
)

app = modal.App(APP_NAME)

with image.imports():
    import cv2
    import numpy as np
    import torch
    from diffusers import AutoencoderKL, ControlNetModel, StableDiffusionXLControlNetImg2ImgPipeline
    from fastapi import HTTPException, Request, Response
    from PIL import Image


def _bounded(value: object, default: float, bounds: tuple[float, float]) -> float:
    """A tuning value from the request, or the default when missing or not a number."""
    try:
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default
    low, high = bounds
    return min(max(number, low), high)


@app.cls(
    image=image,
    gpu="A10G",
    timeout=300,
    # Stay warm for five minutes after a render, so a reviewer trying several finishes waits once.
    scaledown_window=300,
    secrets=[modal.Secret.from_name(AUTH_SECRET_NAME)],
)
class Renderer:
    @modal.enter()
    def load(self) -> None:
        controlnet = ControlNetModel.from_pretrained(CONTROLNET_MODEL, torch_dtype=torch.float16)
        vae = AutoencoderKL.from_pretrained(VAE_MODEL, torch_dtype=torch.float16)
        self.pipe = StableDiffusionXLControlNetImg2ImgPipeline.from_pretrained(
            BASE_MODEL,
            controlnet=controlnet,
            vae=vae,
            torch_dtype=torch.float16,
            variant="fp16",
            use_safetensors=True,
        ).to("cuda")
        self.token = os.environ["RENDER_TOKEN"]

    @modal.fastapi_endpoint(method="POST", docs=False)
    async def render(self, request: Request) -> Response:
        """POST {image_base64, prompt, negative_prompt?, strength?, controlnet_scale?} with
        `Authorization: Bearer <token>`. Returns the photoreal render as a JPEG.
        """
        supplied = request.headers.get("authorization", "").removeprefix("Bearer ").strip()
        if not supplied or not hmac.compare_digest(supplied, self.token):
            raise HTTPException(status_code=401, detail="Invalid render token")

        body = await request.json()
        prompt = str(body.get("prompt", "")).strip()
        if not prompt:
            raise HTTPException(status_code=422, detail="prompt is required")
        try:
            raw = base64.b64decode(body["image_base64"], validate=True)
        except (KeyError, ValueError) as error:
            raise HTTPException(
                status_code=422, detail="image_base64 is missing or invalid"
            ) from error
        if len(raw) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image is too large")

        source = Image.open(io.BytesIO(raw)).convert("RGB")
        source = source.resize(fit_for_sdxl(*source.size), Image.Resampling.LANCZOS)
        edges = cv2.Canny(np.asarray(source), CANNY_LOW, CANNY_HIGH)
        control = Image.fromarray(np.stack([edges] * 3, axis=-1))

        result = self.pipe(
            prompt=prompt,
            negative_prompt=str(body.get("negative_prompt", "")),
            image=source,
            control_image=control,
            strength=_bounded(body.get("strength"), STRENGTH, STRENGTH_RANGE),
            controlnet_conditioning_scale=_bounded(
                body.get("controlnet_scale"), CONTROLNET_SCALE, CONTROLNET_SCALE_RANGE
            ),
            guidance_scale=GUIDANCE_SCALE,
            num_inference_steps=STEPS,
            width=source.width,
            height=source.height,
        ).images[0]

        buffer = io.BytesIO()
        result.save(buffer, format="JPEG", quality=JPEG_QUALITY)
        return Response(content=buffer.getvalue(), media_type="image/jpeg")
