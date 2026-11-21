import type { Capabilities } from '@/domain/models/system';

export interface ISystemRepository {
  getCapabilities(): Promise<Capabilities>;
}
