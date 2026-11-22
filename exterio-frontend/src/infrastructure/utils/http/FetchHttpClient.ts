import type { ITokenStorage } from '@/domain/interfaces/auth';

import { ApiError } from './ApiError';
import { readServerSentEvents, type ServerSentEvent } from './serverSentEvents';
import type { ApiErrorBody, HttpMethod, IHttpClient } from './types';

const HTTP_UNAUTHORIZED = 401;
const HTTP_NO_CONTENT = 204;

interface RequestOptions {
  data?: unknown;
  isAuthRequest?: boolean;
  accept?: string;
  signal?: AbortSignal;
}

/**
 * IHttpClient on top of the Fetch API.
 * Adds the bearer token, serialises JSON / FormData bodies, turns every failure into an
 * ApiError and reports expired sessions through `onUnauthorized`.
 */
export class FetchHttpClient implements IHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenStorage: ITokenStorage,
    private readonly onUnauthorized: () => void
  ) {}

  get<T>(url: string): Promise<T> {
    return this.requestJson<T>('GET', url);
  }

  post<T>(url: string, data?: unknown, isAuthRequest = false): Promise<T> {
    return this.requestJson<T>('POST', url, { data, isAuthRequest });
  }

  put<T>(url: string, data?: unknown): Promise<T> {
    return this.requestJson<T>('PUT', url, { data });
  }

  patch<T>(url: string, data?: unknown): Promise<T> {
    return this.requestJson<T>('PATCH', url, { data });
  }

  delete<T>(url: string): Promise<T> {
    return this.requestJson<T>('DELETE', url);
  }

  async getBlob(url: string): Promise<Blob> {
    const response = await this.send('GET', url);
    return response.blob();
  }

  async *postEventStream(
    url: string,
    data: unknown,
    signal?: AbortSignal
  ): AsyncGenerator<ServerSentEvent> {
    const response = await this.send('POST', url, {
      data,
      accept: 'text/event-stream',
      signal,
    });
    if (!response.body) {
      throw new ApiError('The server sent a response we could not read.', response.status);
    }
    yield* readServerSentEvents(response.body);
  }

  private async requestJson<T>(
    method: HttpMethod,
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const response = await this.send(method, url, options);
    if (response.status === HTTP_NO_CONTENT) {
      return undefined as T;
    }
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError('The server sent a response we could not read.', response.status);
    }
  }

  private async send(
    method: HttpMethod,
    url: string,
    { data, isAuthRequest = false, accept = 'application/json, */*', signal }: RequestOptions = {}
  ): Promise<Response> {
    const isFormData = data instanceof FormData;
    const headers: Record<string, string> = { Accept: accept };

    // The browser sets the multipart boundary itself for FormData.
    if (data !== undefined && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = isAuthRequest ? null : this.tokenStorage.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let body: BodyInit | undefined;
    if (isFormData) {
      body = data;
    } else if (data !== undefined) {
      body = JSON.stringify(data);
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${url}`, { method, headers, body, signal });
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
    }

    if (!response.ok) {
      const error = await this.toApiError(response);
      if (response.status === HTTP_UNAUTHORIZED && !isAuthRequest) {
        this.onUnauthorized();
      }
      throw error;
    }
    return response;
  }

  private async toApiError(response: Response): Promise<ApiError> {
    const fallback = `Something went wrong (HTTP ${response.status}). Please try again.`;
    let body: ApiErrorBody = {};
    try {
      const parsed: unknown = JSON.parse(await response.text());
      if (typeof parsed === 'object' && parsed !== null) {
        body = parsed as ApiErrorBody;
      }
    } catch {
      // Not JSON (e.g. a proxy error page): fall back to the generic message.
    }
    const message = typeof body.message === 'string' && body.message ? body.message : fallback;
    const code = typeof body.code === 'string' ? body.code : undefined;
    const details =
      typeof body.details === 'object' && body.details !== null ? body.details : undefined;
    return new ApiError(message, response.status, code, details);
  }
}
