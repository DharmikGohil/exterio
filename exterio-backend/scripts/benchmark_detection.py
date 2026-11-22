"""Score automatic region detection against the hand-traced sample houses.

Each sample house's parts were traced by hand (`sample_houses/<key>/house.json`), which gives a
correct answer to compare a model's outlines with. For every model and photo this runs the
real detection service, then scores:

- surface IoU: for each kind of part the hand trace has (wall, roof, roof edge, window, door,
  garage door), the overlap of everything the model called that kind with everything traced
  as that kind, from 0 to 1. Walls are reported on their own as well: they drive most of the
  cost.
- parts found (recall) and parts right (precision): a traced part counts as found when a
  detected part of the same kind overlaps it with IoU of at least 0.5.
- off-house: the share of detected wall, roof and roof-edge area that lies outside the traced
  house (grown by 2% of the image width), which catches outlining a neighbouring building.
  Fences and gates are left out, because the traces do not include them.

Detections are saved, so the scores can be recomputed without calling the models again.

    uv run python scripts/benchmark_detection.py --models claude gemini-pro --runs 2
    uv run python scripts/benchmark_detection.py --rescore benchmark_detection.json
"""

import argparse
import json
import sys
import time
from collections import defaultdict
from pathlib import Path
from statistics import mean
from typing import Any

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from bootstrap.env import load_settings  # noqa: E402
from infrastructure.services.ai.anthropic_json import (  # noqa: E402
    AnthropicVisionJsonClient,
    build_anthropic_client,
)
from infrastructure.services.ai.gemini_client import (  # noqa: E402
    GeminiVisionJsonClient,
    build_gemini_client,
)
from infrastructure.services.ai.vision_json_client import VisionJsonClient  # noqa: E402
from infrastructure.services.ai.vision_llm_segmentation_service import (  # noqa: E402
    VisionLlmSegmentationService,
)

SAMPLES_DIR = ROOT / "src/infrastructure/services/imaging/sample_houses"
SAMPLE_KEYS = ("ranch", "two-storey", "brick", "craftsman")
SCORED_LABELS = ("wall", "roof", "roof_edge", "window", "door", "garage_door")
HOUSE_LABELS = frozenset({"wall", "roof", "roof_edge"})
MATCH_IOU = 0.5
HOUSE_MARGIN = 0.02

Polygon = list[list[float]]
Part = dict[str, Any]


def build_client(model_key: str) -> VisionJsonClient:
    settings = load_settings()
    if model_key == "claude":
        claude = build_anthropic_client(
            settings.anthropic_api_key,
            settings.anthropic_gateway_url,
            settings.anthropic_timeout_seconds,
        )
        return AnthropicVisionJsonClient(claude, settings.anthropic_model)
    gemini = build_gemini_client(
        settings.google_vertex_credentials,
        settings.google_vertex_location,
        settings.gemini_timeout_seconds,
    )
    model = {"gemini-pro": "gemini-3.1-pro-preview", "gemini-flash": "gemini-3-flash-preview"}
    return GeminiVisionJsonClient(gemini, model[model_key])


def load_truth(key: str) -> tuple[bytes, int, int, list[Part]]:
    folder = SAMPLES_DIR / key
    image = (folder / "photo.jpg").read_bytes()
    decoded = cv2.imdecode(np.frombuffer(image, np.uint8), cv2.IMREAD_COLOR)
    height, width = decoded.shape[:2]
    house = json.loads((folder / "house.json").read_text(encoding="utf-8"))
    parts = [{"label": item["label"], "polygon": item["polygon"]} for item in house["regions"]]
    return image, width, height, parts


def detect(client: VisionJsonClient, image: bytes, width: int, height: int) -> list[Part]:
    regions = VisionLlmSegmentationService(client).detect(image, width, height)
    return [
        {"label": region.label.value, "polygon": [list(point) for point in region.polygon]}
        for region in regions
    ]


def mask(polygons: list[Polygon], width: int, height: int) -> np.ndarray:
    canvas = np.zeros((height, width), np.uint8)
    for polygon in polygons:
        cv2.fillPoly(canvas, [np.round(np.array(polygon)).astype(np.int32)], 1)
    return canvas.astype(bool)


def iou(a: np.ndarray, b: np.ndarray) -> float:
    union = np.logical_or(a, b).sum()
    return float(np.logical_and(a, b).sum() / union) if union else 1.0


def score(truth: list[Part], found: list[Part], width: int, height: int) -> dict[str, Any]:
    by_label_truth: dict[str, list[Polygon]] = defaultdict(list)
    by_label_found: dict[str, list[Polygon]] = defaultdict(list)
    for part in truth:
        by_label_truth[part["label"]].append(part["polygon"])
    for part in found:
        by_label_found[part["label"]].append(part["polygon"])

    surface = {
        label: iou(
            mask(by_label_truth[label], width, height), mask(by_label_found[label], width, height)
        )
        for label in SCORED_LABELS
        if by_label_truth[label]
    }

    # Greedy one-to-one matching of parts of the same kind.
    matched = 0
    for label, truth_polygons in by_label_truth.items():
        candidates = [mask([polygon], width, height) for polygon in by_label_found[label]]
        used: set[int] = set()
        for polygon in truth_polygons:
            truth_mask = mask([polygon], width, height)
            best, best_index = 0.0, -1
            for index, candidate in enumerate(candidates):
                if index not in used and (value := iou(truth_mask, candidate)) > best:
                    best, best_index = value, index
            if best >= MATCH_IOU:
                used.add(best_index)
                matched += 1

    house = mask([part["polygon"] for part in truth], width, height).astype(np.uint8)
    margin = max(1, round(HOUSE_MARGIN * width))
    house = cv2.dilate(house, np.ones((margin, margin), np.uint8)).astype(bool)
    found_house = mask(
        [part["polygon"] for part in found if part["label"] in HOUSE_LABELS], width, height
    )
    found_area = found_house.sum()
    off_house = float(np.logical_and(found_house, ~house).sum() / found_area) if found_area else 0.0

    return {
        "surface_iou": surface,
        "mean_iou": mean(surface.values()),
        "wall_iou": surface.get("wall", 0.0),
        "recall": matched / len(truth),
        "precision": matched / len(found) if found else 0.0,
        "off_house": off_house,
        "parts": len(found),
        "truth_parts": len(truth),
    }


def run(models: list[str], runs: int) -> dict[str, Any]:
    results: dict[str, Any] = {"detections": []}
    for model_key in models:
        client = build_client(model_key)
        for key in SAMPLE_KEYS:
            image, width, height, _ = load_truth(key)
            for attempt in range(1, runs + 1):
                started = time.monotonic()
                try:
                    found = detect(client, image, width, height)
                    error = None
                except Exception as failure:  # a failed run is recorded, not fatal
                    found, error = [], str(failure)
                seconds = round(time.monotonic() - started, 1)
                print(
                    f"{model_key:12} {key:10} run {attempt}: {len(found)} parts, {seconds}s"
                    + (f"  ERROR {error}" if error else ""),
                    flush=True,
                )
                results["detections"].append(
                    {
                        "model": model_key,
                        "sample": key,
                        "run": attempt,
                        "seconds": seconds,
                        "error": error,
                        "parts": found,
                    }
                )
    return results


def report(results: dict[str, Any]) -> str:
    rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    per_sample: dict[tuple[str, str], list[float]] = defaultdict(list)
    for item in results["detections"]:
        _, width, height, truth = load_truth(item["sample"])
        if item["error"]:
            rows[item["model"]].append({"failed": True, "seconds": item["seconds"]})
            continue
        scores = score(truth, item["parts"], width, height)
        scores["seconds"] = item["seconds"]
        rows[item["model"]].append(scores)
        per_sample[(item["model"], item["sample"])].append(scores["mean_iou"])

    lines = [
        "| Model | Runs ok | Mean surface IoU | Wall IoU | Parts found | Parts right | "
        "Off-house area | Parts (traced) | Time |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for model, items in rows.items():
        ok = [item for item in items if not item.get("failed")]
        if not ok:
            lines.append(f"| {model} | 0 / {len(items)} | | | | | | | |")
            continue
        lines.append(
            f"| {model} | {len(ok)} / {len(items)} "
            f"| {mean(i['mean_iou'] for i in ok):.2f} "
            f"| {mean(i['wall_iou'] for i in ok):.2f} "
            f"| {mean(i['recall'] for i in ok):.0%} "
            f"| {mean(i['precision'] for i in ok):.0%} "
            f"| {mean(i['off_house'] for i in ok):.1%} "
            f"| {mean(i['parts'] for i in ok):.0f} ({mean(i['truth_parts'] for i in ok):.0f}) "
            f"| {mean(i['seconds'] for i in ok):.0f} s |"
        )
    lines += [
        "",
        "Mean surface IoU per photo:",
        "",
        "| Model | " + " | ".join(SAMPLE_KEYS) + " |",
        "|---|" + "---|" * len(SAMPLE_KEYS),
    ]
    for model in rows:
        cells = [
            f"{mean(values):.2f}" if (values := per_sample.get((model, key))) else "-"
            for key in SAMPLE_KEYS
        ]
        lines.append(f"| {model} | " + " | ".join(cells) + " |")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument(
        "--models",
        nargs="+",
        default=["claude", "gemini-pro"],
        choices=["claude", "gemini-pro", "gemini-flash"],
    )
    parser.add_argument("--runs", type=int, default=2)
    parser.add_argument("--out", type=Path, default=Path("benchmark_detection.json"))
    parser.add_argument(
        "--rescore", type=Path, help="Score saved detections without calling models"
    )
    args = parser.parse_args()

    if args.rescore:
        results = json.loads(args.rescore.read_text(encoding="utf-8"))
    else:
        results = run(args.models, args.runs)
        args.out.write_text(json.dumps(results), encoding="utf-8")
    print()
    print(report(results))


if __name__ == "__main__":
    main()
