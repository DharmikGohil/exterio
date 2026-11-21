export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface IHttpClient {
  get<T>(url: string): Promise<T>;
  /**
   * @param isAuthRequest set for sign-in style calls: no bearer token is sent and a 401
   * is treated as "wrong credentials" instead of "session expired".
   */
  post<T>(url: string, data?: unknown, isAuthRequest?: boolean): Promise<T>;
  put<T>(url: string, data?: unknown): Promise<T>;
  patch<T>(url: string, data?: unknown): Promise<T>;
  delete<T>(url: string): Promise<T>;
  /** GET that returns the raw response body (e.g. a PDF), sent with the auth header. */
  getBlob(url: string): Promise<Blob>;
}

/** Shape of every non-2xx response body (see docs/API.md). */
export interface ApiErrorBody {
  status?: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}
