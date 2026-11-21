from domain.entities.material_entity import MaterialUnit
from domain.entities.region_entity import RegionLabel
from infrastructure.repository.implementation.knowledge_repo_impl import TfidfKnowledgeRepository
from infrastructure.repository.implementation.material_repo_impl import JsonMaterialRepository
from infrastructure.services.imaging.sample_house_provider import SAMPLE_MATERIALS
from infrastructure.services.imaging.texture_factory import PATTERNS


def test_catalogue_is_well_formed():
    materials = JsonMaterialRepository().find_all()

    assert len({material.id for material in materials}) == len(materials)
    for material in materials:
        assert material.applies_to, material.id
        assert material.material_rate > 0 and material.labour_rate > 0, material.id
        assert material.texture.pattern in PATTERNS, material.id
        assert RegionLabel.WINDOW not in material.applies_to, "nothing is applied to openings"
        expected_unit = (
            MaterialUnit.RFT if RegionLabel.RAILING in material.applies_to else MaterialUnit.SQFT
        )
        assert material.unit == expected_unit, material.id


def test_every_region_type_that_takes_a_finish_has_a_material():
    materials = JsonMaterialRepository().find_all()
    covered = {label for material in materials for label in material.applies_to}

    assert covered == set(RegionLabel) - {RegionLabel.WINDOW, RegionLabel.DOOR}


def test_sample_house_materials_exist_and_fit_their_surface():
    repo = JsonMaterialRepository()

    for label, material_id in SAMPLE_MATERIALS.items():
        material = repo.find_by_id(material_id)
        assert material is not None, material_id
        assert material.can_apply_to(label), (label, material_id)


def test_retrieval_ranks_the_relevant_note_first():
    repo = TfidfKnowledgeRepository()

    actual_glass = repo.search("How often do I need to clean a glass railing?", limit=3)
    actual_stone = repo.search("is stone cladding too heavy for my wall", limit=3)
    actual_budget = repo.search("how do I get the most from a limited budget", limit=3)

    assert actual_glass[0].title.startswith("Glass railing")
    assert actual_stone[0].title.startswith("Natural stone cladding")
    assert actual_budget[0].title.startswith("Getting the most")


def test_retrieval_returns_nothing_for_an_unrelated_question():
    assert TfidfKnowledgeRepository().search("zzz qqq xyzzy", limit=3) == []
