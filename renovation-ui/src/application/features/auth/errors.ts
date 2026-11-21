import { AppError } from '@/application/shared/errors';

export class AuthError extends AppError {
  constructor(message: string, code?: string, status = 401) {
    super(message, code, status);
    this.name = 'AuthError';
  }
}

/** The session is missing, expired or the credentials were wrong (HTTP 401). */
export class UnauthorizedError extends AuthError {
  constructor(message = 'Your session has expired. Please sign in again.', code?: string) {
    super(message, code, 401);
    this.name = 'UnauthorizedError';
  }
}
