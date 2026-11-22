"""Renders the before / after pairs shown on the sign-in page.

Each sample house is rendered with its finished design by the same instant preview the studio
uses, so the sign-in page shows exactly what the product does. Run from exterio-backend after
changing a sample house or the preview renderer:

    uv run python scripts/render_showcase.py
"""

import sys
from pathlib import Path

import cv2

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from domain.interfaces.services.image_services import PreviewRequest  # noqa: E402
from infrastructure.repository.implementation.material_repo_impl import (  # noqa: E402
    JsonMaterialRepository,
)
from infrastructure.services.imaging.image_codec import decode_image  # noqa: E402
from infrastructure.services.imaging.opencv_preview_render_service import (  # noqa: E402
    OpenCvPreviewRenderService,
)
from infrastructure.services.imaging.photo_sample_house_provider import (  # noqa: E402
    PhotoSampleHouseProvider,
)

OUTPUT_DIR = Path(__file__).resolve().parents[2] / "exterio-frontend" / "public" / "showcase"
WIDTH_PX = 1200
JPEG_QUALITY = 82


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    provider, materials, renderer = (
        PhotoSampleHouseProvider(),
        JsonMaterialRepository(),
        OpenCvPreviewRenderService(),
    )
    for summary in provider.samples():
        house = provider.build(summary.key)
        request = PreviewRequest(
            image=house.image,
            regions=house.regions,
            materials_by_region={
                region_id: material
                for region_id, material_id in house.assignments.items()
                if (material := materials.find_by_id(material_id)) is not None
            },
            facade_corners=house.scale.facade_corners,
            facade_width_ft=house.scale.facade_width_ft,
            facade_height_ft=house.scale.facade_height_ft,
        )
        for suffix, data in (("before", house.image), ("after", renderer.render(request))):
            image = decode_image(data)
            height = round(image.shape[0] * WIDTH_PX / image.shape[1])
            resized = cv2.resize(image, (WIDTH_PX, height), interpolation=cv2.INTER_AREA)
            path = OUTPUT_DIR / f"{summary.key}-{suffix}.jpg"
            cv2.imwrite(str(path), resized, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
            print(f"{path.name}  {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
