import { ValidationError } from '@/application/shared/errors';
import type { IAdvisorRepository, IAdvisorService } from '@/domain/interfaces/advisor';
import type { AdvisorChatParams, AdvisorStreamEvent } from '@/domain/models/advisor';

export class AdvisorService implements IAdvisorService {
  constructor(private readonly advisorRepository: IAdvisorRepository) {}

  chatStream(
    params: AdvisorChatParams,
    onEvent: (event: AdvisorStreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const messages = params.messages
      .map((message) => ({ role: message.role, content: message.content.trim() }))
      .filter((message) => message.content.length > 0);

    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') {
      return Promise.reject(new ValidationError('Type a question for the advisor first.'));
    }
    return this.advisorRepository.chatStream({ ...params, messages }, onEvent, signal);
  }
}
