"""HTTP-level tests: routing, auth, validation, error mapping and the full user flow."""

import json

import numpy as np
import pytest
from tests.helpers.app_factory import build_test_client, guest_headers

from infrastructure.services.imaging.image_codec import encode_jpeg
from infrastructure.services.imaging.sample_house_provider import SampleHouseProvider


@pytest.fixture
def client(tmp_path):
    return build_test_client(tmp_path)[0]


@pytest.fixture
def ai(tmp_path):
    client, fakes = build_test_client(tmp_path, with_ai=True)
    return client, fakes


@pytest.fixture
def headers(client):
    return guest_headers(client)


@pytest.fixture
def sample(client, headers):
    # The finished sample: every step of the flow has data to test against.
    return client.post("/api/projects/sample?key=craftsman", headers=headers).json()


def test_health_check_is_public(client):
    assert client.get("/api/health-check").json() == {"status": "ok"}


def test_protected_routes_reject_missing_and_bad_tokens(client):
    actual_missing = client.get("/api/projects")
    actual_bad = client.get("/api/projects", headers={"Authorization": "Bearer nope"})

    assert actual_missing.status_code == 401
    assert actual_missing.json() == {
        "status": "error",
        "message": "Please sign in to continue",
        "code": "AUTH_003",
    }
    assert actual_bad.status_code == 401


def test_register_login_and_duplicate_email(client):
    input_user = {"email": "Asha@Example.com", "password": "correct-horse", "name": "Asha"}

    actual_register = client.post("/api/auth/register", json=input_user)
    actual_duplicate = client.post("/api/auth/register", json=input_user)
    actual_login = client.post(
        "/api/auth/login", json={"email": "asha@example.com", "password": "correct-horse"}
    )
    actual_wrong = client.post(
        "/api/auth/login", json={"email": "asha@example.com", "password": "wrong-password"}
    )

    assert actual_register.status_code == 200
    assert actual_register.json()["user"] == {
        "id": actual_register.json()["user"]["id"],
        "email": "asha@example.com",
        "name": "Asha",
        "isGuest": False,
    }
    assert actual_duplicate.status_code == 409
    assert actual_duplicate.json()["code"] == "AUTH_002"
    assert actual_login.status_code == 200
    assert actual_wrong.status_code == 401
    token = actual_login.json()["accessToken"]
    assert (
        client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).json()["name"]
        == "Asha"
    )


def test_weak_password_and_invalid_email_are_rejected(client):
    actual_weak = client.post(
        "/api/auth/register", json={"email": "a@example.com", "password": "short", "name": "A"}
    )
    actual_email = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "long-enough-pw", "name": "A"},
    )

    assert (actual_weak.status_code, actual_weak.json()["code"]) == (400, "AUTH_004")
    assert (actual_email.status_code, actual_email.json()["code"]) == (400, "VALIDATION_001")


def test_capabilities_report_ai_as_off_without_keys(client, headers):
    actual = client.get("/api/system/capabilities", headers=headers).json()

    assert actual == {
        "autoDetect": False,
        "photorealRender": False,
        "visionCheck": False,
        "advisor": False,
    }


def test_materials_catalogue_is_served_with_swatches(client, headers):
    actual = client.get("/api/materials", headers=headers).json()

    assert len(actual) >= 15
    assert {"id", "category", "unit", "swatchUrl", "materialRate", "appliesTo"} <= set(actual[0])
    assert client.get(actual[0]["swatchUrl"]).headers["content-type"] == "image/png"


def test_sample_project_is_complete_and_listed(client, headers, sample):
    assert sample["image"]["quality"]["usable"] is True
    assert len(sample["regions"]) == 21
    assert sample["scale"]["method"] == "facade_dimensions"
    assert sample["designs"][0]["previewUrl"]
    assert client.get(sample["designs"][0]["previewUrl"]).status_code == 200

    actual_list = client.get("/api/projects", headers=headers).json()

    assert [item["id"] for item in actual_list] == [sample["id"]]
    assert actual_list[0]["designCount"] == 1
    assert client.get(actual_list[0]["thumbnailUrl"]).status_code == 200
    estimate = client.get(
        f"/api/designs/{sample['designs'][0]['id']}/estimate", headers=headers
    ).json()
    assert actual_list[0]["progressStep"] == 4
    assert actual_list[0]["progressLabel"] == "Estimate ready"
    assert actual_list[0]["estimateTotal"] == estimate["totals"]["grandTotal"]


def test_a_new_project_is_listed_at_the_first_step_without_a_total(client, headers):
    client.post("/api/projects", headers=headers, json={"name": "Empty house"})

    actual = client.get("/api/projects", headers=headers).json()[0]

    assert (actual["progressStep"], actual["progressLabel"]) == (1, "No photo yet")
    assert actual["estimateTotal"] is None


def test_another_user_cannot_see_or_change_a_project(client, sample):
    other = guest_headers(client)
    design_id = sample["designs"][0]["id"]

    assert client.get(f"/api/projects/{sample['id']}", headers=other).status_code == 404
    assert client.delete(f"/api/projects/{sample['id']}", headers=other).status_code == 404
    assert client.get(f"/api/designs/{design_id}/estimate", headers=other).status_code == 404
    assert client.get(f"/api/designs/{design_id}/report", headers=other).status_code == 404
    assert client.get("/api/projects", headers=other).json() == []


def test_estimate_has_material_labour_category_and_grand_totals(client, headers, sample):
    actual = client.get(
        f"/api/designs/{sample['designs'][0]['id']}/estimate", headers=headers
    ).json()

    assert actual["currency"] == "INR"
    assert actual["scale"]["confidencePct"] == 8.0
    wall = next(region for region in actual["regions"] if region["name"] == "Garage wall")
    # Counted straight from the traced outline, outside the measuring pipeline: the wall's pixels
    # less the garage door on it, at 44 ft across and 9.5 ft up the facade, is 60.7 sq ft.
    assert wall["areaSqft"] == pytest.approx(60.7, rel=0.03)
    assert sum(line["total"] for line in actual["lines"]) == pytest.approx(
        actual["totals"]["grandTotal"]
    )
    assert sum(item["total"] for item in actual["categories"]) == pytest.approx(
        actual["totals"]["grandTotal"]
    )
    assert actual["totals"]["materialCost"] + actual["totals"]["labourCost"] == pytest.approx(
        actual["totals"]["grandTotal"]
    )
    assert (
        actual["totals"]["lowEstimate"]
        < actual["totals"]["grandTotal"]
        < actual["totals"]["highEstimate"]
    )


def test_editing_a_rate_recalculates_costs_and_can_be_reset(client, headers, sample):
    design_id = sample["designs"][0]["id"]
    estimate_url = f"/api/designs/{design_id}/estimate"
    before = client.get(estimate_url, headers=headers).json()
    paint = next(line for line in before["lines"] if line["materialId"] == "paint-warm-cream")

    client.put(
        f"/api/projects/{sample['id']}/rates",
        headers=headers,
        json={"overrides": {"paint-warm-cream": {"materialRate": 28, "wastagePct": 0}}},
    )
    after = client.get(estimate_url, headers=headers).json()
    paint_after = next(line for line in after["lines"] if line["materialId"] == "paint-warm-cream")
    client.put(f"/api/projects/{sample['id']}/rates", headers=headers, json={"overrides": {}})
    reset = client.get(estimate_url, headers=headers).json()

    assert paint_after["materialRate"] == 28
    assert paint_after["grossQuantity"] == paint["netQuantity"]
    assert paint_after["materialCost"] == pytest.approx(paint["netQuantity"] * 28)
    assert paint_after["labourCost"] == paint["labourCost"]
    assert after["totals"]["grandTotal"] != before["totals"]["grandTotal"]
    assert reset["totals"] == before["totals"]


def test_invalid_rates_are_rejected(client, headers, sample):
    url = f"/api/projects/{sample['id']}/rates"

    actual_unknown = client.put(
        url, headers=headers, json={"overrides": {"nope": {"materialRate": 1}}}
    )
    actual_negative = client.put(
        url, headers=headers, json={"overrides": {"paint-warm-cream": {"materialRate": -5}}}
    )

    assert (actual_unknown.status_code, actual_unknown.json()["code"]) == (400, "PROJECT_005")
    assert actual_negative.status_code == 400


def test_area_override_wins_and_is_flagged(client, headers, sample):
    regions = sample["regions"]
    wall = next(region for region in regions if region["name"] == "Garage wall")
    wall["areaOverrideSqft"] = 500

    saved = client.put(
        f"/api/projects/{sample['id']}/regions", headers=headers, json={"regions": regions}
    )
    estimate = client.get(
        f"/api/designs/{sample['designs'][0]['id']}/estimate", headers=headers
    ).json()

    assert saved.status_code == 200
    actual = next(region for region in estimate["regions"] if region["name"] == "Garage wall")
    assert actual["areaSqft"] == 500
    assert actual["isOverride"] is True
    assert any("entered by hand" in note for note in estimate["assumptions"])


def test_deleting_a_region_drops_its_assignment_but_keeps_the_design(client, headers, sample):
    kept = [region for region in sample["regions"] if region["label"] != "garage_door"]

    saved = client.put(
        f"/api/projects/{sample['id']}/regions", headers=headers, json={"regions": kept}
    ).json()

    design = saved["designs"][0]
    assert len(saved["regions"]) == 20
    assert set(design["assignments"]) <= {region["id"] for region in saved["regions"]}
    assert design["previewUrl"] and design["previewUrl"] != sample["designs"][0]["previewUrl"]


def test_region_validation_rejects_degenerate_polygons(client, headers, sample):
    bad = [
        {"label": "wall", "name": "Sliver", "polygon": [[0, 0], [10, 10]], "surfaceMultiplier": 1}
    ]

    actual = client.put(
        f"/api/projects/{sample['id']}/regions", headers=headers, json={"regions": bad}
    )

    assert (actual.status_code, actual.json()["code"]) == (400, "VALIDATION_001")


def test_scale_method_changes_the_estimate_and_its_confidence(client, headers, sample):
    design_id = sample["designs"][0]["id"]
    scale = {**sample["scale"], "method": "door_height", "doorHeightFt": 7}

    saved = client.put(f"/api/projects/{sample['id']}/scale", headers=headers, json=scale)
    estimate = client.get(f"/api/designs/{design_id}/estimate", headers=headers).json()

    assert saved.status_code == 200
    assert estimate["scale"]["method"] == "door_height"
    assert estimate["scale"]["confidencePct"] == 20.0
    wall = next(region for region in estimate["regions"] if region["name"] == "Garage wall")
    # The door method rests on one door assumed to be 7 ft tall, so it gives its own reading of the
    # wall rather than the one the wall's measured size gives.
    assert wall["areaSqft"] > 0
    assert wall["areaSqft"] != pytest.approx(60.7, rel=0.02)


def test_scale_validation_needs_the_measurements_for_the_chosen_method(client, headers, sample):
    scale = {
        **sample["scale"],
        "method": "reference_line",
        "referenceLine": None,
        "referenceLengthFt": None,
    }

    actual = client.put(f"/api/projects/{sample['id']}/scale", headers=headers, json=scale)

    assert (actual.status_code, actual.json()["code"]) == (400, "PROJECT_004")


def test_designs_can_be_created_copied_changed_and_deleted(client, headers, sample):
    first = sample["designs"][0]
    wall = next(region for region in sample["regions"] if region["name"] == "Garage wall")
    window = next(region for region in sample["regions"] if region["label"] == "window")
    roof = next(region for region in sample["regions"] if region["label"] == "roof")

    copy = client.post(
        f"/api/projects/{sample['id']}/designs",
        headers=headers,
        json={"name": "Option B", "copyFromDesignId": first["id"]},
    )
    changed = client.put(
        f"/api/designs/{copy.json()['id']}",
        headers=headers,
        json={"assignments": {**copy.json()["assignments"], wall["id"]: "stone-grey-ledge"}},
    )
    on_window = client.put(
        f"/api/designs/{copy.json()['id']}",
        headers=headers,
        json={"assignments": {window["id"]: "paint-warm-cream"}},
    )
    wrong_surface = client.put(
        f"/api/designs/{copy.json()['id']}",
        headers=headers,
        json={"assignments": {roof["id"]: "paint-warm-cream"}},
    )

    assert copy.status_code == 201
    assert copy.json()["assignments"] == first["assignments"]
    assert changed.json()["assignments"][wall["id"]] == "stone-grey-ledge"
    assert changed.json()["previewUrl"] != copy.json()["previewUrl"]
    assert (on_window.status_code, on_window.json()["code"]) == (400, "DESIGN_002")
    assert wrong_surface.status_code == 400

    totals = [
        client.get(f"/api/designs/{design_id}/estimate", headers=headers).json()["totals"][
            "grandTotal"
        ]
        for design_id in (first["id"], copy.json()["id"])
    ]
    assert totals[1] > totals[0], "stone on the wall must cost more than paint"

    assert client.delete(f"/api/designs/{copy.json()['id']}", headers=headers).status_code == 204
    assert client.get(f"/api/designs/{copy.json()['id']}", headers=headers).status_code == 404
    assert len(client.get(f"/api/projects/{sample['id']}", headers=headers).json()["designs"]) == 1


def test_report_is_a_pdf_download(client, headers, sample):
    actual = client.get(f"/api/designs/{sample['designs'][0]['id']}/report", headers=headers)

    assert actual.status_code == 200
    assert actual.headers["content-type"] == "application/pdf"
    assert "renovation-report-craftsman-with-stone.pdf" in actual.headers["content-disposition"]
    assert actual.content.startswith(b"%PDF")


def test_upload_accepts_a_good_photo_and_resets_regions(client, headers, sample):
    photo = SampleHouseProvider().build().image

    actual = client.post(
        f"/api/projects/{sample['id']}/image",
        headers=headers,
        files={"file": ("house.jpg", photo, "image/jpeg")},
    )

    body = actual.json()
    assert actual.status_code == 200
    assert body["regions"] == []
    assert body["scale"] is None
    assert body["image"]["url"] != sample["image"]["url"]
    assert body["designs"][0]["assignments"] == {}
    assert body["designs"][0]["previewUrl"] is None


def test_upload_rejects_a_bad_photo_with_reasons_and_guidance(client, headers):
    project = client.post("/api/projects", headers=headers, json={"name": "New house"}).json()
    dark = encode_jpeg(np.full((900, 1200, 3), 6, dtype=np.uint8))

    actual_dark = client.post(
        f"/api/projects/{project['id']}/image",
        headers=headers,
        files={"file": ("dark.jpg", dark, "image/jpeg")},
    )
    actual_garbage = client.post(
        f"/api/projects/{project['id']}/image",
        headers=headers,
        files={"file": ("x.jpg", b"not an image", "image/jpeg")},
    )

    assert actual_dark.status_code == 422
    assert actual_dark.json()["code"] == "IMAGE_002"
    quality = actual_dark.json()["details"]["quality"]
    assert quality["usable"] is False
    assert {issue["code"] for issue in quality["issues"]} >= {"TOO_DARK"}
    assert quality["guidance"]
    assert (actual_garbage.status_code, actual_garbage.json()["code"]) == (400, "IMAGE_001")
    assert client.get(f"/api/projects/{project['id']}", headers=headers).json()["image"] is None


def test_steps_that_need_a_photo_say_so(client, headers):
    project = client.post("/api/projects", headers=headers, json={"name": ""}).json()

    actual = client.put(
        f"/api/projects/{project['id']}/regions", headers=headers, json={"regions": []}
    )

    assert project["name"] == "My house"
    assert (actual.status_code, actual.json()["code"]) == (409, "PROJECT_002")


def test_ai_endpoints_return_503_when_not_configured(client, headers, sample):
    design_id = sample["designs"][0]["id"]

    actual_detect = client.post(f"/api/projects/{sample['id']}/regions/detect", headers=headers)
    actual_render = client.post(f"/api/designs/{design_id}/render", headers=headers)
    actual_advisor = client.post(
        "/api/advisor/chat",
        headers=headers,
        json={"projectId": sample["id"], "messages": [{"role": "user", "content": "hi"}]},
    )

    for actual in (actual_detect, actual_render, actual_advisor):
        assert (actual.status_code, actual.json()["code"]) == (503, "AI_001")


def test_detection_replaces_auto_regions_and_keeps_user_regions(ai):
    client, _ = ai
    headers = guest_headers(client)
    sample = client.post("/api/projects/sample?key=craftsman", headers=headers).json()
    mine = {
        "label": "gate",
        "name": "My gate",
        "polygon": [[10, 10], [80, 10], [80, 90], [10, 90]],
        "surfaceMultiplier": 1,
    }
    client.put(
        f"/api/projects/{sample['id']}/regions",
        headers=headers,
        json={"regions": [*sample["regions"], mine]},
    )

    actual = client.post(f"/api/projects/{sample['id']}/regions/detect", headers=headers).json()

    names = {region["name"]: region for region in actual["regions"]}
    assert set(names) == {"My gate", "Wall 1", "Door 1", "Pillar 1"}
    assert names["My gate"]["source"] == "user"
    assert names["Wall 1"]["source"] == "auto"
    assert names["Pillar 1"]["surfaceMultiplier"] == 3.0


def test_photoreal_render_runs_in_background_and_is_capped_per_user(ai):
    client, fakes = ai
    headers = guest_headers(client)
    sample = client.post("/api/projects/sample?key=craftsman", headers=headers).json()
    design_id = sample["designs"][0]["id"]

    first = client.post(f"/api/designs/{design_id}/render", headers=headers)
    done = client.get(f"/api/designs/{design_id}", headers=headers).json()
    second = client.post(f"/api/designs/{design_id}/render", headers=headers)
    third = client.post(f"/api/designs/{design_id}/render", headers=headers)

    assert first.json()["renderStatus"] == "pending"
    assert done["renderStatus"] == "done"
    assert client.get(done["renderUrl"]).status_code == 200
    finishes = fakes["photoreal"].finishes[0]
    assert ("wall", "Exterior emulsion - Warm Cream") in {(f.surface, f.material) for f in finishes}
    assert len(finishes) == len(set(finishes))
    assert second.status_code == 200
    assert (third.status_code, third.json()["code"]) == (429, "DESIGN_004")


def test_changing_a_design_discards_its_stale_render(ai):
    client, _ = ai
    headers = guest_headers(client)
    sample = client.post("/api/projects/sample?key=craftsman", headers=headers).json()
    design = sample["designs"][0]
    client.post(f"/api/designs/{design['id']}/render", headers=headers)

    actual = client.put(
        f"/api/designs/{design['id']}", headers=headers, json={"assignments": design["assignments"]}
    ).json()

    assert actual["renderStatus"] == "none"
    assert actual["renderUrl"] is None


def test_advisor_answers_with_retrieved_notes_and_project_figures(ai):
    client, fakes = ai
    headers = guest_headers(client)
    sample = client.post("/api/projects/sample?key=craftsman", headers=headers).json()

    actual = client.post(
        "/api/advisor/chat",
        headers=headers,
        json={
            "projectId": sample["id"],
            "designId": sample["designs"][0]["id"],
            "messages": [
                {"role": "user", "content": "Is stone cladding too heavy for my pillars?"}
            ],
        },
    )

    assert actual.status_code == 200
    assert actual.json()["reply"] == "Stone suits the pillars best."
    assert actual.json()["sources"][0]["title"].startswith("Natural stone cladding")
    prompt = fakes["advisor_model"].system_prompts[0]
    assert "Natural stone cladding" in prompt, "retrieved note must be in the prompt"
    assert "Exterior emulsion - Warm Cream" in prompt, (
        "the project's own figures must be in the prompt"
    )
    assert "Grand total INR" in prompt


def _read_events(body: str) -> list[tuple[str, dict]]:
    events = []
    for block in body.strip().split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.splitlines())
        events.append((lines["event"], json.loads(lines["data"])))
    return events


def test_advisor_stream_shows_each_step_then_the_answer_in_pieces(ai):
    client, _ = ai
    headers = guest_headers(client)
    sample = client.post("/api/projects/sample?key=craftsman", headers=headers).json()

    actual = client.post(
        "/api/advisor/chat/stream",
        headers=headers,
        json={
            "projectId": sample["id"],
            "designId": sample["designs"][0]["id"],
            "messages": [{"role": "user", "content": "Is stone cladding worth it?"}],
        },
    )

    assert actual.status_code == 200
    assert actual.headers["content-type"].startswith("text/event-stream")
    events = _read_events(actual.text)
    steps = [(data["key"], data["status"]) for name, data in events if name == "step"]
    assert steps == [
        ("notes", "running"),
        ("notes", "done"),
        ("project", "done"),
        ("answer", "running"),
        ("answer", "done"),
    ]
    notes = next(data for name, data in events if name == "step" and data["status"] == "done")
    assert "Natural stone cladding" in notes["detail"], "the step must name the notes it found"
    house = next(d for n, d in events if n == "step" and d["key"] == "project")
    assert "₹" in house["detail"], "the step must state the design's estimate"
    text = "".join(data["text"] for name, data in events if name == "text")
    assert text == "Stone suits the pillars best."
    assert events[-1][0] == "done"
    assert events[-1][1]["reply"] == text
    assert events[-1][1]["sources"][0]["title"].startswith("Natural stone cladding")


def test_advisor_stream_refuses_another_users_project_before_streaming(ai):
    client, _ = ai
    owner = guest_headers(client)
    sample = client.post("/api/projects/sample?key=craftsman", headers=owner).json()

    actual = client.post(
        "/api/advisor/chat/stream",
        headers=guest_headers(client),
        json={"projectId": sample["id"], "messages": [{"role": "user", "content": "hi"}]},
    )

    assert actual.status_code == 404


def test_report_survives_markup_characters_in_user_supplied_names(client, headers, sample):
    hostile = "<b>Villa</b> & <unknown tag>"
    client.patch(f"/api/projects/{sample['id']}", headers=headers, json={"name": hostile})
    regions = sample["regions"]
    regions[0]["name"] = "Wall <A> & co"
    client.put(f"/api/projects/{sample['id']}/regions", headers=headers, json={"regions": regions})

    actual = client.get(f"/api/designs/{sample['designs'][0]['id']}/report", headers=headers)

    assert actual.status_code == 200
    assert actual.content.startswith(b"%PDF")


def test_demo_account_is_published_seeded_and_signs_in(tmp_path):
    client = build_test_client(tmp_path, demo_account_email="Reviewer@Example.com")[0]

    published = client.get("/api/auth/demo-account").json()
    login = client.post("/api/auth/login", json=published)
    token = login.json()["accessToken"]
    projects = client.get("/api/projects", headers={"Authorization": f"Bearer {token}"}).json()

    assert published == {"email": "reviewer@example.com", "password": "review-2026"}
    assert login.status_code == 200
    assert login.json()["user"]["isGuest"] is False
    assert sorted(project["name"] for project in projects) == [
        "Brick house with dormers",
        "Craftsman with stone",
        "Single-storey ranch",
        "Two-storey with garage",
    ]


def test_demo_account_is_off_when_no_email_is_set(client):
    assert client.get("/api/auth/demo-account").json() is None


def test_each_sample_request_adds_the_next_house_then_a_chosen_one(client, headers):
    first = client.post("/api/projects/sample", headers=headers).json()
    second = client.post("/api/projects/sample", headers=headers).json()
    chosen = client.post("/api/projects/sample?key=craftsman", headers=headers).json()

    assert first["name"] == "Single-storey ranch"
    assert second["name"] == "Two-storey with garage"
    assert chosen["name"] == "Craftsman with stone"
    assert chosen["designs"][0]["name"] == "Sage, cream and sandstone"
    assert chosen["designs"][0]["previewUrl"]


def test_samples_are_created_at_different_stages(client, headers):
    created = {
        key: client.post(f"/api/projects/sample?key={key}", headers=headers).json()
        for key in ("ranch", "two-storey", "brick", "craftsman")
    }
    listed = {item["id"]: item for item in client.get("/api/projects", headers=headers).json()}

    def stage(key):
        project = created[key]
        summary = listed[project["id"]]
        has_finishes = bool(project["designs"][0]["assignments"])
        return (
            bool(project["regions"]),
            project["scale"] is not None,
            has_finishes,
            summary["progressLabel"],
        )

    assert stage("ranch") == (False, False, False, "Photo added")
    assert stage("two-storey") == (True, False, False, "Designing")
    assert stage("brick") == (True, True, False, "Designing")
    assert stage("craftsman") == (True, True, True, "Estimate ready")
