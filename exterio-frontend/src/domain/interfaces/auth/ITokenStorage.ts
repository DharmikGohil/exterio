export interface ITokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
}
