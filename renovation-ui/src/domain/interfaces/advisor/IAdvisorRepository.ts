import type { AdvisorChatParams, AdvisorReply } from '@/domain/models/advisor';

export interface IAdvisorRepository {
  chat(params: AdvisorChatParams): Promise<AdvisorReply>;
}
