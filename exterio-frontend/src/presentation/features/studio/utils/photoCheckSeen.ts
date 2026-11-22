/**
 * Whether this browser has already shown a house's photo check. The first time a house's photo
 * is opened (a sample, or a house shared from another device), its saved check is revealed step
 * by step, as it is after an upload; after that the result shows straight away.
 */
const KEY_PREFIX = 'exterio.photoCheckSeen.';

export function hasSeenPhotoCheck(projectId: string): boolean {
  try {
    return window.localStorage.getItem(KEY_PREFIX + projectId) === '1';
  } catch {
    // Storage blocked: never hold the user up with a reveal they cannot dismiss for good.
    return true;
  }
}

export function markPhotoCheckSeen(projectId: string): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + projectId, '1');
  } catch {
    // Storage blocked: the reveal simply plays again next time.
  }
}
