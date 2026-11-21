/**
 * A failed HTTP exchange. `status` is 0 when no response was received at all.
 * Repositories translate this into application errors; it never reaches the UI directly.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
