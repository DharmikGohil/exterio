import type { Material } from '@/domain/models/material';

export interface IMaterialService {
  listMaterials(): Promise<Material[]>;
}
