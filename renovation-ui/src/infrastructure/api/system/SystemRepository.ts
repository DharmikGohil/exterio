import type { ISystemRepository } from '@/domain/interfaces/system';
import type { Capabilities } from '@/domain/models/system';

import { BaseRepository } from '../BaseRepository';

export class SystemRepository extends BaseRepository implements ISystemRepository {
  getCapabilities(): Promise<Capabilities> {
    return this.execute(() => this.httpClient.get<Capabilities>('/api/system/capabilities'));
  }
}
