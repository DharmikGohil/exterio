import { config } from '@/config';
import type { ITokenStorage } from '@/domain/interfaces/auth';

import { FetchHttpClient } from './FetchHttpClient';
import type { IHttpClient } from './types';

/** Creates the app's HTTP client, pointed at the configured API base URL. */
export function createHttpClient(
  tokenStorage: ITokenStorage,
  onUnauthorized: () => void
): IHttpClient {
  return new FetchHttpClient(config.apiBaseUrl, tokenStorage, onUnauthorized);
}
