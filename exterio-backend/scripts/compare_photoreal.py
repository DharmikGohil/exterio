"""Render the sample houses with each photoreal renderer and lay the results side by side.

For every sample house: the photo, the instant preview of its design, and the photoreal render
from each configured renderer, each merged back onto the photo exactly as the app does (edited
pixels inside the refinished parts, original pixels elsewhere). Writes one comparison sheet per
house and prints how long each render took.

    uv run python scripts/compare_photoreal.py --out /tmp/photoreal
"""

import argparse
import sys
import time
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from bootstrap.env import load_settings  # noqa: E402
from domain.interfaces.services.image_services import (  # noqa: E402
    IPhotorealRenderService,
    PreviewRequest,
    RenderFinish,
)
from infrastructure.repository.implementation.material_repo_impl import (  # noqa: E402
    JsonMaterialRepository,
)
from infrastructure.services.ai.gemini_client import build_gemini_client  # noqa: E402
from infrastructure.services.ai.gemini_photoreal_render_service import (  # noqa: E402
    GeminiPhotorealRenderService,
)
from infrastructure.services.ai.modal_photoreal_render_service import (  # noqa: E402
    ModalPhotorealRenderService,
)
from infrastructure.services.imaging.image_codec import decode_image  # noqa: E402
from infrastructure.services.imaging.opencv_preview_render_service import (  # noqa: E402
    OpenCvPreviewRenderService,
)
from infrastructure.services.imaging.photo_sample_house_provider import (  # noqa: E402
    PhotoSampleHouseProvider,
)

TILE_WIDTH = 560
GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image"


def renderers() -> dict[str, IPhotorealRenderService]:
    settings = load_settings()
    found: dict[str, IPhotorealRenderService] = {}
    modal = ModalPhotorealRenderService(
        settings.modal_render_url, settings.modal_render_token, 300, 1000
    )
    if modal.is_available():
        found["Modal (SDXL + ControlNet)"] = modal
    gemini = build_gemini_client(
        settings.google_vertex_credentials, settings.google_vertex_location, 150
    )
    if gemini is not None:
        found["Gemini 2.5 Flash Image"] = GeminiPhotorealRenderService(
            gemini, GEMINI_IMAGE_MODEL, 1000
        )
    return found


def tile(image: np.ndarray, title: str) -> np.ndarray:
    height = round(image.shape[0] * TILE_WIDTH / image.shape[1])
    resized = cv2.resize(image, (TILE_WIDTH, height), interpolation=cv2.INTER_AREA)
    band = np.full((36, TILE_WIDTH, 3), 255, np.uint8)
    cv2.putText(band, title, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (30, 30, 30), 1, cv2.LINE_AA)
    return np.vstack([band, resized])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--only", nargs="+", help="Sample keys to render, e.g. brick")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    provider, materials, preview = (
        PhotoSampleHouseProvider(),
        JsonMaterialRepository(),
        OpenCvPreviewRenderService(),
    )
    available = renderers()
    print("renderers:", ", ".join(available) or "none configured")
    for summary in provider.samples():
        if args.only and summary.key not in args.only:
            continue
        house = provider.build(summary.key)
        by_region = {
            region_id: material
            for region_id, material_id in house.assignments.items()
            if (material := materials.find_by_id(material_id)) is not None
        }
        composite = preview.render(
            PreviewRequest(
                image=house.image,
                regions=house.regions,
                materials_by_region=by_region,
                facade_corners=house.scale.facade_corners,
                facade_width_ft=house.scale.facade_width_ft,
                facade_height_ft=house.scale.facade_height_ft,
            )
        )
        finishes: dict[RenderFinish, None] = {}
        for region in house.regions:
            if (material := by_region.get(region.id)) is not None:
                surface = region.label.replace("_", " ")
                finishes[
                    RenderFinish(surface, material.name, material.description, material.color_hex)
                ] = None

        tiles = [
            tile(decode_image(house.image), "Photo"),
            tile(decode_image(composite), "Instant preview"),
        ]
        for name, renderer in available.items():
            started = time.monotonic()
            try:
                edited = renderer.render(composite, tuple(finishes))
                merged = preview.merge_with_original(
                    house.image, edited, house.regions, frozenset(by_region)
                )
                seconds = time.monotonic() - started
                tiles.append(tile(decode_image(merged), f"{name}  ({seconds:.0f} s)"))
                print(f"{summary.key:10} {name}: {seconds:.1f}s")
            except Exception as error:  # a failed render is shown, not fatal
                print(f"{summary.key:10} {name}: FAILED {error}")
        rows = [np.hstack(tiles[index : index + 2]) for index in range(0, len(tiles), 2)]
        width = max(row.shape[1] for row in rows)
        rows = [
            np.hstack([row, np.full((row.shape[0], width - row.shape[1], 3), 255, np.uint8)])
            for row in rows
        ]
        cv2.imwrite(str(args.out / f"{summary.key}.jpg"), np.vstack(rows))


if __name__ == "__main__":
    main()
