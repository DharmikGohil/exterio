const DEFAULT_API_BASE_URL = 'http://localhost:8000';

function normaliseBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  return (trimmed || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export const config = {
  appName: 'Exterio',
  apiBaseUrl: normaliseBaseUrl(import.meta.env.VITE_API_BASE_URL),
  tokenStorageKey: 'exterio.accessToken',
  /** How often a pending photoreal render is polled. */
  renderPollIntervalMs: 2500,
  /** Idle time before an inline rate/area edit is sent to the server. */
  inlineEditDebounceMs: 700,
  upload: {
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: '.jpg,.jpeg,.png,.webp',
    /** Matches the API's MAX_UPLOAD_MB default. */
    maxBytes: 15 * 1024 * 1024,
  },
} as const;
