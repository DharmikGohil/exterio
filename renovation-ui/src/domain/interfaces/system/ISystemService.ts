import type { Capabilities } from '@/domain/models/system';

export interface ISystemService {
  getCapabilities(): Promise<Capabilities>;
}
