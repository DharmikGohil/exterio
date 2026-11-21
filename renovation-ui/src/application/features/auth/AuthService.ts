import { ValidationError } from '@/application/shared/errors';
import type { IAuthRepository, IAuthService, ITokenStorage } from '@/domain/interfaces/auth';
import type {
  AuthResponse,
  DemoAccount,
  LoginParams,
  RegisterFormParams,
  User,
} from '@/domain/models/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Matches the API's minimum password length. */
const MIN_PASSWORD_LENGTH = 8;

export class AuthService implements IAuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly tokenStorage: ITokenStorage
  ) {}

  async register(params: RegisterFormParams): Promise<AuthResponse> {
    const name = params.name.trim();
    const email = this.validateEmail(params.email);
    if (!name) {
      throw new ValidationError('Please tell us your name.');
    }
    if (params.password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(
        `Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`
      );
    }
    if (params.confirmPassword !== params.password) {
      throw new ValidationError('The two passwords do not match.');
    }
    return this.startSession(
      await this.authRepository.register({ name, email, password: params.password })
    );
  }

  async login(params: LoginParams): Promise<AuthResponse> {
    const email = this.validateEmail(params.email);
    if (!params.password) {
      throw new ValidationError('Please enter your password.');
    }
    return this.startSession(await this.authRepository.login({ email, password: params.password }));
  }

  async loginAsGuest(): Promise<AuthResponse> {
    return this.startSession(await this.authRepository.loginAsGuest());
  }

  getCurrentUser(): Promise<User> {
    return this.authRepository.getCurrentUser();
  }

  getDemoAccount(): Promise<DemoAccount | null> {
    return this.authRepository.getDemoAccount();
  }

  hasSession(): boolean {
    return this.tokenStorage.getToken() !== null;
  }

  logout(): void {
    this.tokenStorage.clearToken();
  }

  private startSession(response: AuthResponse): AuthResponse {
    this.tokenStorage.setToken(response.accessToken);
    return response;
  }

  private validateEmail(value: string): string {
    const email = value.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      throw new ValidationError('Please enter a valid email address.');
    }
    return email;
  }
}
