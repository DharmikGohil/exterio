"""Image sizing for SDXL, kept free of GPU libraries so it can be tested anywhere."""

SDXL_MAX_SIDE = 1024
# Short sides below this degrade SDXL output, so narrow photos are enlarged up to it...
SDXL_MIN_SIDE = 512
# ...but never past this long side, which is where SDXL starts repeating details.
SDXL_HARD_MAX_SIDE = 1536
# SDXL's VAE works on 8-pixel blocks.
SDXL_MULTIPLE = 8


def fit_for_sdxl(width: int, height: int) -> tuple[int, int]:
    """Scale a photo to SDXL's working size, keeping its shape, on the 8px grid.

    The long side becomes 1024. A narrow photo is enlarged so its short side reaches 512, as long
    as the long side stays within 1536. The API resizes the result back to the photo's own size,
    so only the aspect ratio has to survive.
    """
    if width <= 0 or height <= 0:
        raise ValueError("Image dimensions must be positive")
    long_side, short_side = max(width, height), min(width, height)
    scale = SDXL_MAX_SIDE / long_side
    if short_side * scale < SDXL_MIN_SIDE:
        scale = min(SDXL_MIN_SIDE / short_side, SDXL_HARD_MAX_SIDE / long_side)
    return _snap(width * scale), _snap(height * scale)


def _snap(value: float) -> int:
    return max(SDXL_MULTIPLE, round(value / SDXL_MULTIPLE) * SDXL_MULTIPLE)
