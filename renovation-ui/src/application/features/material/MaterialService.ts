import type { IMaterialRepository, IMaterialService } from '@/domain/interfaces/material';
import type { Material } from '@/domain/models/material';

export class MaterialService implements IMaterialService {
  constructor(private readonly materialRepository: IMaterialRepository) {}

  listMaterials(): Promise<Material[]> {
    return this.materialRepository.listMaterials();
  }
}
