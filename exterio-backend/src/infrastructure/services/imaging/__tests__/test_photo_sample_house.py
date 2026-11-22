import pytest

from domain.entities.region_entity import RegionLabel
from infrastructure.repository.implementation.material_repo_impl import JsonMaterialRepository
from infrastructure.services.imaging.image_codec import decode_image
from infrastructure.services.imaging.photo_sample_house_provider import (
    SAMPLE_KEYS,
    PhotoSampleHouseProvider,
)


@pytest.mark.parametrize("key", SAMPLE_KEYS)
def test_each_sample_loads_with_its_traced_parts_inside_the_photo(key):
    actual = PhotoSampleHouseProvider().build(key)

    height, width = decode_image(actual.image).shape[:2]
    assert width == 1600
    assert len({region.id for region in actual.regions}) == len(actual.regions) >= 10
    for region in actual.regions:
        assert all(0 <= x <= width and 0 <= y <= height for x, y in region.polygon), region.name
    x0, y0 = actual.scale.facade_corners[0]
    x2, y2 = actual.scale.facade_corners[2]
    assert 0 <= x0 < x2 <= width and 0 <= y0 < y2 <= height


@pytest.mark.parametrize("key", SAMPLE_KEYS)
def test_each_sample_finish_exists_and_suits_the_part_it_is_on(key):
    actual = PhotoSampleHouseProvider().build(key)
    materials = JsonMaterialRepository()

    by_id = {region.id: region for region in actual.regions}
    assert actual.assignments, "a sample must open with a finished design"
    for region_id, material_id in actual.assignments.items():
        material = materials.find_by_id(material_id)
        assert material is not None, material_id
        assert by_id[region_id].label in material.applies_to, (by_id[region_id].name, material_id)


def test_samples_are_offered_in_order_with_distinct_names():
    actual = PhotoSampleHouseProvider().samples()

    assert [sample.key for sample in actual] == list(SAMPLE_KEYS)
    assert len({sample.name for sample in actual}) == len(actual)


def test_an_unknown_key_falls_back_to_the_first_sample():
    provider = PhotoSampleHouseProvider()

    assert provider.build("nope").name == provider.build(SAMPLE_KEYS[0]).name


def test_a_part_can_keep_its_own_finish():
    actual = PhotoSampleHouseProvider().build("craftsman")

    names = {region.id: region.name for region in actual.regions}
    finishes = {names[region_id]: material for region_id, material in actual.assignments.items()}
    assert finishes["Garage wall"] == "stone-sandstone-ashlar"
    assert finishes["Main gable"] == "paint-sage-grey"
    assert RegionLabel.WALL in {region.label for region in actual.regions}
