import type {
  AuthResponse,
  DemoAccount,
  LoginParams,
  RegisterParams,
  User,
} from '@/domain/models/auth';

export interface IAuthRepository {
  register(params: RegisterParams): Promise<AuthResponse>;
  login(params: LoginParams): Promise<AuthResponse>;
  loginAsGuest(): Promise<AuthResponse>;
  getCurrentUser(): Promise<User>;
  /** The published reviewer sign-in, or `null` when this deployment has none. */
  getDemoAccount(): Promise<DemoAccount | null>;
}
