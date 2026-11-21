import { ValidationError } from '@/application/shared/errors';
import type { IAdvisorRepository, IAdvisorService } from '@/domain/interfaces/advisor';
import type { AdvisorChatParams, AdvisorReply } from '@/domain/models/advisor';

export class AdvisorService implements IAdvisorService {
  constructor(private readonly advisorRepository: IAdvisorRepository) {}

  async chat(params: AdvisorChatParams): Promise<AdvisorReply> {
    const messages = params.messages
      .map((message) => ({ role: message.role, content: message.content.trim() }))
      .filter((message) => message.content.length > 0);

    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') {
      throw new ValidationError('Type a question for the advisor first.');
    }
    return this.advisorRepository.chat({ ...params, messages });
  }
}
