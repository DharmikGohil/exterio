import { describe, expect, it } from 'vitest';

import { readServerSentEvents } from '@/infrastructure/utils/http/serverSentEvents';

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

async function readAll(body: ReadableStream<Uint8Array>) {
  const events = [];
  for await (const event of readServerSentEvents(body)) {
    events.push(event);
  }
  return events;
}

describe('readServerSentEvents', () => {
  it('joins a message split across network chunks and splits messages sharing one', async () => {
    const body = streamOf(
      'event: step\ndata: {"key":"no',
      'tes"}\n\nevent: text\ndata: {"text":"Hi"}\n\nevent: done\n',
      'data: {}\n\n'
    );

    const actual = await readAll(body);

    expect(actual).toEqual([
      { event: 'step', data: '{"key":"notes"}' },
      { event: 'text', data: '{"text":"Hi"}' },
      { event: 'done', data: '{}' },
    ]);
  });

  it('reads Windows line endings and a last message without a blank line', async () => {
    const actual = await readAll(streamOf('event: text\r\ndata: a\r\n\r\nevent: done\ndata: b'));

    expect(actual).toEqual([
      { event: 'text', data: 'a' },
      { event: 'done', data: 'b' },
    ]);
  });
});
