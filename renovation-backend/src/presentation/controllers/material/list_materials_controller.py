from domain.use_cases.material.list_materials_usecase import ListMaterialsUseCase
from presentation.schemas.project_schema import MaterialResponse


class ListMaterialsController:
    def __init__(self, list_materials: ListMaterialsUseCase) -> None:
        self._list_materials = list_materials

    def handle(self) -> list[MaterialResponse]:
        return [MaterialResponse.model_validate(item) for item in self._list_materials.execute()]
