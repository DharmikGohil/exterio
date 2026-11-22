import type { AdvisorChatParams, AdvisorStreamEvent } from '@/domain/models/advisor';

export interface IAdvisorRepository {
  /**
   * Asks the advisor and reports its work as it happens. Resolves when the answer is complete;
   * rejects if it fails, including part way through.
   */
  chatStream(
    params: AdvisorChatParams,
    onEvent: (event: AdvisorStreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void>;
}
