import type {
  AuthResponse,
  DemoAccount,
  LoginParams,
  RegisterFormParams,
  User,
} from '@/domain/models/auth';

export interface IAuthService {
  /** Creates an account and stores the session token. */
  /** Checks the form (including that both passwords match), creates the account and stores the session token. */
  register(params: RegisterFormParams): Promise<AuthResponse>;
  /** Signs in and stores the session token. */
  login(params: LoginParams): Promise<AuthResponse>;
  /** Starts an anonymous session and stores the session token. */
  loginAsGuest(): Promise<AuthResponse>;
  getCurrentUser(): Promise<User>;
  /** The published reviewer sign-in, or `null` when this deployment has none. */
  getDemoAccount(): Promise<DemoAccount | null>;
  /** `true` when a session token is stored on this device. */
  hasSession(): boolean;
  /** Forgets the stored session token. */
  logout(): void;
}
