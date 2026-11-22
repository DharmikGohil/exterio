/** One message of a `text/event-stream` response. */
export interface ServerSentEvent {
  event: string;
  data: string;
}

/**
 * Reads server-sent events from a response body as they arrive. Messages end at a blank line;
 * a message may be split across network chunks, and several may share one chunk.
 */
export async function* readServerSentEvents(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ServerSentEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n');
      let end = buffer.indexOf('\n\n');
      while (end !== -1) {
        const message = parseMessage(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (message) {
          yield message;
        }
        end = buffer.indexOf('\n\n');
      }
      if (done) {
        const last = parseMessage(buffer);
        if (last) {
          yield last;
        }
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseMessage(block: string): ServerSentEvent | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data.push(line.slice(5).replace(/^ /, ''));
    }
  }
  return data.length > 0 ? { event, data: data.join('\n') } : null;
}
