"""Prompt for the photoreal pass.

The model receives the instant preview, where every finish is already in the
right place. Its only job is realism, so the prompt forbids geometry changes.
"""

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


def build_render_prompt(finishes: list[str]) -> str:
    listed = "\n".join(f"- {finish}" for finish in finishes)
    return RENDER_PROMPT_TEMPLATE.format(finishes=listed)
