import type { Estimate } from '@/domain/models/estimate';

export interface IEstimateService {
  getEstimate(designId: string): Promise<Estimate>;
  /** The PDF report for a design. */
  getReport(designId: string): Promise<Blob>;
}
