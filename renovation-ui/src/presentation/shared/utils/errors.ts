const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

/** The message to show a user for any thrown value. */
export function getErrorMessage(error: unknown, fallback = FALLBACK_MESSAGE): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
