import { AppError } from '@/application/shared/errors';
import type { IAdvisorRepository } from '@/domain/interfaces/advisor';
import type {
  AdvisorChatParams,
  AdvisorReply,
  AdvisorStep,
  AdvisorStreamEvent,
} from '@/domain/models/advisor';
import type { ServerSentEvent } from '@/infrastructure/utils/http';

import { BaseRepository } from '../BaseRepository';

const STREAM_URL = '/api/advisor/chat/stream';
const FAILED = 'The advisor could not answer right now.';

export class AdvisorRepository extends BaseRepository implements IAdvisorRepository {
  chatStream(
    params: AdvisorChatParams,
    onEvent: (event: AdvisorStreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    return this.execute(async () => {
      let finished = false;
      for await (const message of this.httpClient.postEventStream(STREAM_URL, params, signal)) {
        const event = toStreamEvent(message);
        if (event) {
          finished = finished || event.type === 'done';
          onEvent(event);
        }
      }
      if (!finished && !signal?.aborted) {
        throw new AppError('The answer was cut off. Try again.');
      }
    });
  }
}

/** Wire event -> domain event. An `error` event is thrown; unknown events are skipped. */
function toStreamEvent({ event, data }: ServerSentEvent): AdvisorStreamEvent | null {
  const payload = parse(data);
  switch (event) {
    case 'step':
      return { type: 'step', step: payload as unknown as AdvisorStep };
    case 'text':
      return { type: 'text', text: String(payload.text ?? '') };
    case 'done':
      return { type: 'done', reply: payload as unknown as AdvisorReply };
    case 'error':
      throw new AppError(typeof payload.message === 'string' ? payload.message : FAILED);
    default:
      return null;
  }
}

function parse(data: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(data);
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  } catch {
    throw new AppError(FAILED);
  }
}
