import type { Material } from '@/domain/models/material';

export interface IMaterialRepository {
  listMaterials(): Promise<Material[]>;
}
