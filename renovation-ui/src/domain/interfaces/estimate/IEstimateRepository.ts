import type { Estimate } from '@/domain/models/estimate';

export interface IEstimateRepository {
  getEstimate(designId: string): Promise<Estimate>;
  getReport(designId: string): Promise<Blob>;
}
