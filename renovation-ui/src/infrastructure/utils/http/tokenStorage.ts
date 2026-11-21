import type { ITokenStorage } from '@/domain/interfaces/auth';

/** Keeps the access token in localStorage. Falls back to memory if storage is unavailable. */
export class LocalStorageTokenStorage implements ITokenStorage {
  private memoryToken: string | null = null;

  constructor(private readonly storageKey: string) {}

  getToken(): string | null {
    try {
      return window.localStorage.getItem(this.storageKey) ?? this.memoryToken;
    } catch {
      return this.memoryToken;
    }
  }

  setToken(token: string): void {
    this.memoryToken = token;
    try {
      window.localStorage.setItem(this.storageKey, token);
    } catch {
      // Private browsing or blocked storage: the in-memory copy keeps the tab signed in.
    }
  }

  clearToken(): void {
    this.memoryToken = null;
    try {
      window.localStorage.removeItem(this.storageKey);
    } catch {
      // Nothing to clear.
    }
  }
}
