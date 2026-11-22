from domain.interfaces.services.image_services import RenderFinish
from domain.prompts.photoreal_render_prompt import (
    MAX_DIFFUSION_FINISHES,
    build_diffusion_prompt,
    build_render_prompt,
)

STONE = RenderFinish("pillar", "Sandstone cladding - Ashlar", "Dressed sandstone blocks")
PAINT = RenderFinish("wall", "Exterior emulsion - Warm Cream", "Smooth acrylic paint")


def test_instruction_prompt_lists_each_finish_and_forbids_geometry_changes():
    actual = build_render_prompt([STONE, PAINT])

    assert "- pillar: Sandstone cladding - Ashlar (Dressed sandstone blocks)" in actual
    assert "- wall: Exterior emulsion - Warm Cream (Smooth acrylic paint)" in actual
    assert "Do not change the shape" in actual


def test_diffusion_prompt_is_a_short_description_of_the_finished_house():
    actual = build_diffusion_prompt([STONE, PAINT])

    assert "sandstone cladding - ashlar on the pillar" in actual.prompt
    assert "exterior emulsion - warm cream on the wall" in actual.prompt
    assert "Do not" not in actual.prompt
    assert "cartoon" in actual.negative_prompt


def test_diffusion_prompt_stays_short_with_many_finishes():
    many = [RenderFinish("wall", f"Paint {index}", "") for index in range(12)]

    actual = build_diffusion_prompt(many).prompt

    assert f"paint {MAX_DIFFUSION_FINISHES - 1} on the wall" in actual
    assert f"paint {MAX_DIFFUSION_FINISHES} on the wall" not in actual
    # Roughly CLIP's 77-token window.
    assert len(actual.split()) < 70


def test_diffusion_prompt_still_reads_well_with_no_finishes():
    assert "freshly finished walls" in build_diffusion_prompt([]).prompt


def test_the_brief_pins_each_colour_and_keeps_objects_in_front_of_the_house():
    actual = build_render_prompt([RenderFinish("wall", "Sage grey", "Matt paint", "#9caf88")])

    assert "Sage grey (Matt paint), colour #9caf88" in actual
    assert "White stays white" in actual
    assert "lamp posts" in actual
