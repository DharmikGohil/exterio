import type { ISystemRepository, ISystemService } from '@/domain/interfaces/system';
import type { Capabilities } from '@/domain/models/system';

export class SystemService implements ISystemService {
  constructor(private readonly systemRepository: ISystemRepository) {}

  getCapabilities(): Promise<Capabilities> {
    return this.systemRepository.getCapabilities();
  }
}
