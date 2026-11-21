import { UnauthorizedError } from '@/application/features/auth/errors';
import {
  AppError,
  NetworkError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '@/application/shared/errors';
import { ApiError } from '@/infrastructure/utils/http/ApiError';
import type { IHttpClient } from '@/infrastructure/utils/http/types';

export enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  UNPROCESSABLE_ENTITY = 422,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Base class for API repositories: owns the IHttpClient and maps transport failures
 * (ApiError) to application errors. Feature repositories override `handleErrorCode`
 * for their own error codes.
 */
export abstract class BaseRepository {
  constructor(protected readonly httpClient: IHttpClient) {}

  /** Runs an HTTP call and rethrows any failure as an application error. */
  protected async execute<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected handleError(error: unknown): Error {
    if (error instanceof AppError) {
      return error;
    }
    if (!(error instanceof ApiError)) {
      return new AppError(error instanceof Error ? error.message : 'Something went wrong.');
    }

    const featureError = error.code ? this.handleErrorCode(error) : null;
    if (featureError) {
      return featureError;
    }

    switch (error.status) {
      case 0:
        return new NetworkError(error.message);
      case HttpStatusCode.UNAUTHORIZED:
        return new UnauthorizedError(error.message, error.code);
      case HttpStatusCode.BAD_REQUEST:
      case HttpStatusCode.UNPROCESSABLE_ENTITY:
        return new ValidationError(error.message, error.code);
      case HttpStatusCode.NOT_FOUND:
        return new NotFoundError(error.message, error.code);
      case HttpStatusCode.SERVICE_UNAVAILABLE:
        return new ServiceUnavailableError(error.message, error.code);
      default:
        return new AppError(error.message, error.code, error.status);
    }
  }

  /** Feature-specific mapping by API error code. Return `null` to use the status mapping. */
  protected handleErrorCode(_error: ApiError): Error | null {
    return null;
  }
}
