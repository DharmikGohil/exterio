import type { IMaterialRepository } from '@/domain/interfaces/material';
import type { Material } from '@/domain/models/material';

import { BaseRepository } from '../BaseRepository';

export class MaterialRepository extends BaseRepository implements IMaterialRepository {
  listMaterials(): Promise<Material[]> {
    return this.execute(() => this.httpClient.get<Material[]>('/api/materials'));
  }
}
