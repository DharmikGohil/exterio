import { describe, expect, it } from 'vitest';

import { AppError } from '@/application/shared/errors';
import type { AdvisorStreamEvent } from '@/domain/models/advisor';
import { AdvisorRepository } from '@/infrastructure/api/advisor/AdvisorRepository';
import type { IHttpClient, ServerSentEvent } from '@/infrastructure/utils/http';

function clientSending(...messages: ServerSentEvent[]): IHttpClient {
  return {
    async *postEventStream() {
      yield* messages;
    },
  } as unknown as IHttpClient;
}

const params = { projectId: 'p1', messages: [{ role: 'user' as const, content: 'hi' }] };

describe('AdvisorRepository.chatStream', () => {
  it('turns the wire events into steps, text and the finished reply', async () => {
    const repository = new AdvisorRepository(
      clientSending(
        {
          event: 'step',
          data: '{"key":"notes","label":"Searching","status":"running","detail":""}',
        },
        { event: 'text', data: '{"text":"Stone "}' },
        { event: 'done', data: '{"reply":"Stone lasts.","sources":[{"title":"Stone"}]}' }
      )
    );
    const events: AdvisorStreamEvent[] = [];

    await repository.chatStream(params, (event) => events.push(event));

    expect(events.map((event) => event.type)).toEqual(['step', 'text', 'done']);
    expect(events[2]).toEqual({
      type: 'done',
      reply: { reply: 'Stone lasts.', sources: [{ title: 'Stone' }] },
    });
  });

  it('fails with the server message when the answer fails part way', async () => {
    const repository = new AdvisorRepository(
      clientSending(
        { event: 'text', data: '{"text":"Sto"}' },
        { event: 'error', data: '{"message":"The advisor is busy. Try again in a minute."}' }
      )
    );

    await expect(repository.chatStream(params, () => undefined)).rejects.toThrow(
      'The advisor is busy. Try again in a minute.'
    );
  });

  it('fails when the stream ends without a finished answer', async () => {
    const repository = new AdvisorRepository(
      clientSending({ event: 'text', data: '{"text":"a"}' })
    );

    await expect(repository.chatStream(params, () => undefined)).rejects.toBeInstanceOf(AppError);
  });
});
