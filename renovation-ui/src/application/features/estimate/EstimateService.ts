import type { IEstimateRepository, IEstimateService } from '@/domain/interfaces/estimate';
import type { Estimate } from '@/domain/models/estimate';

export class EstimateService implements IEstimateService {
  constructor(private readonly estimateRepository: IEstimateRepository) {}

  getEstimate(designId: string): Promise<Estimate> {
    return this.estimateRepository.getEstimate(designId);
  }

  getReport(designId: string): Promise<Blob> {
    return this.estimateRepository.getReport(designId);
  }
}
