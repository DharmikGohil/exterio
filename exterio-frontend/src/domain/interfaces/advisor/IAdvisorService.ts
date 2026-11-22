import type { AdvisorChatParams, AdvisorStreamEvent } from '@/domain/models/advisor';

export interface IAdvisorService {
  chatStream(
    params: AdvisorChatParams,
    onEvent: (event: AdvisorStreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void>;
}
