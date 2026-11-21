import type { AdvisorChatParams, AdvisorReply } from '@/domain/models/advisor';

export interface IAdvisorService {
  chat(params: AdvisorChatParams): Promise<AdvisorReply>;
}
