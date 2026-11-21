"""Prompts for the photoreal pass.

The model receives the instant preview, where every finish is already in the right place. Its
only job is realism. Two model families need two kinds of prompt:

- Instruction-following image-edit models (fal.ai) read a full brief, including what not to change.
- Diffusion models (SDXL on Modal) read about 77 tokens of description. Geometry is held by the
  ControlNet and the merge step instead, so their prompt only describes the finished house.
"""

from collections.abc import Sequence
from dataclasses import dataclass

from domain.interfaces.services.image_services import RenderFinish

RENDER_PROMPT_TEMPLATE = """Photorealistic architectural photograph of a house exterior.

The image already shows the planned renovation as flat material overlays:
{finishes}

Make these finishes look physically real: natural material depth, joints and grain, \
correct shadows, ambient occlusion, weathering-free clean surfaces, and lighting that \
matches the rest of the photo.

Strict rules:
- Do not change the shape or position of the building, walls, windows, doors, balconies, \
pillars, railings or roof line.
- Do not add or remove any architectural element.
- Do not change the camera angle, the sky, the ground, vegetation or surroundings.
- Keep every edge exactly where it is. Only improve the realism of the listed finishes."""

DIFFUSION_PROMPT_TEMPLATE = (
    "professional architectural photograph of a modern Indian house facade, {finishes}, "
    "realistic material texture and depth, natural daylight, soft shadows, sharp focus"
)
DIFFUSION_NEGATIVE_PROMPT = (
    "cartoon, illustration, painting, render, flat colours, blurry, distorted, warped lines, "
    "extra windows, extra doors, text, watermark, people"
)
# Keeps the diffusion prompt inside CLIP's 77-token window.
MAX_DIFFUSION_FINISHES = 5


@dataclass(frozen=True)
class DiffusionPrompt:
    prompt: str
    negative_prompt: str


def build_render_prompt(finishes: Sequence[RenderFinish]) -> str:
    listed = "\n".join(
        f"- {finish.surface}: {finish.material} ({finish.description})" for finish in finishes
    )
    return RENDER_PROMPT_TEMPLATE.format(finishes=listed)


def build_diffusion_prompt(finishes: Sequence[RenderFinish]) -> DiffusionPrompt:
    described = ", ".join(
        f"{finish.material.lower()} on the {finish.surface}"
        for finish in finishes[:MAX_DIFFUSION_FINISHES]
    )
    return DiffusionPrompt(
        prompt=DIFFUSION_PROMPT_TEMPLATE.format(finishes=described or "freshly finished walls"),
        negative_prompt=DIFFUSION_NEGATIVE_PROMPT,
    )
