import type { IEstimateRepository } from '@/domain/interfaces/estimate';
import type { Estimate } from '@/domain/models/estimate';

import { BaseRepository } from '../BaseRepository';

export class EstimateRepository extends BaseRepository implements IEstimateRepository {
  getEstimate(designId: string): Promise<Estimate> {
    return this.execute(() =>
      this.httpClient.get<Estimate>(`/api/designs/${encodeURIComponent(designId)}/estimate`)
    );
  }

  getReport(designId: string): Promise<Blob> {
    return this.execute(() =>
      this.httpClient.getBlob(`/api/designs/${encodeURIComponent(designId)}/report`)
    );
  }
}
