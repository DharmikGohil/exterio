from domain.entities.region_entity import RegionLabel
from infrastructure.services.imaging.image_codec import decode_image
from infrastructure.services.imaging.photo_sample_house_provider import PhotoSampleHouseProvider


def test_the_sample_photo_loads_with_its_traced_parts_inside_the_frame():
    actual = PhotoSampleHouseProvider().build()

    height, width = decode_image(actual.image).shape[:2]
    assert (width, height) == (1600, 1226)
    assert len(actual.regions) == 26
    assert len({region.id for region in actual.regions}) == 26
    for region in actual.regions:
        assert all(0 <= x <= width and 0 <= y <= height for x, y in region.polygon), region.name


def test_every_finish_in_the_sample_suits_the_parts_it_is_put_on():
    actual = PhotoSampleHouseProvider().build()

    labels = {region.label for region in actual.regions}
    assert set(actual.material_by_label) <= labels
    assert actual.material_by_label[RegionLabel.WALL] == "paint-sage-grey"
    assert actual.scale.facade_width_ft == 30
