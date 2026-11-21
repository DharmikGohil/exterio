import type { IAdvisorRepository } from '@/domain/interfaces/advisor';
import type { AdvisorChatParams, AdvisorReply } from '@/domain/models/advisor';

import { BaseRepository } from '../BaseRepository';

export class AdvisorRepository extends BaseRepository implements IAdvisorRepository {
  chat(params: AdvisorChatParams): Promise<AdvisorReply> {
    return this.execute(() => this.httpClient.post<AdvisorReply>('/api/advisor/chat', params));
  }
}
