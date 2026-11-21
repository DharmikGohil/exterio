/**
 * Base class for every error the UI is expected to show.
 * `message` is always safe to display to the user.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Please check what you entered and try again.', code?: string) {
    super(message, code, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'We could not find what you were looking for.', code?: string) {
    super(message, code, 404);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Could not reach the server. Check your connection and try again.') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

/** An optional AI capability is not configured on the server (HTTP 503, code AI_001). */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'This feature is not available right now.', code?: string) {
    super(message, code, 503);
    this.name = 'ServiceUnavailableError';
  }
}
