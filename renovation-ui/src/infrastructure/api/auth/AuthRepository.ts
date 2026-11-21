import type { IAuthRepository } from '@/domain/interfaces/auth';
import type {
  AuthResponse,
  DemoAccount,
  LoginParams,
  RegisterParams,
  User,
} from '@/domain/models/auth';

import { BaseRepository } from '../BaseRepository';

export class AuthRepository extends BaseRepository implements IAuthRepository {
  register(params: RegisterParams): Promise<AuthResponse> {
    return this.execute(() =>
      this.httpClient.post<AuthResponse>('/api/auth/register', params, true)
    );
  }

  login(params: LoginParams): Promise<AuthResponse> {
    return this.execute(() => this.httpClient.post<AuthResponse>('/api/auth/login', params, true));
  }

  loginAsGuest(): Promise<AuthResponse> {
    return this.execute(() =>
      this.httpClient.post<AuthResponse>('/api/auth/guest', undefined, true)
    );
  }

  getCurrentUser(): Promise<User> {
    return this.execute(() => this.httpClient.get<User>('/api/auth/me'));
  }

  getDemoAccount(): Promise<DemoAccount | null> {
    return this.execute(() => this.httpClient.get<DemoAccount | null>('/api/auth/demo-account'));
  }
}
