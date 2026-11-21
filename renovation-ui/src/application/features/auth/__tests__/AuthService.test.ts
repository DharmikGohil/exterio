import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '@/application/features/auth/AuthService';
import { ValidationError } from '@/application/shared/errors';
import type { IAuthRepository, ITokenStorage } from '@/domain/interfaces/auth';
import type { AuthResponse } from '@/domain/models/auth';

const response: AuthResponse = {
  accessToken: 'token-123',
  user: { id: 'u1', email: 'asha@example.com', name: 'Asha', isGuest: false },
};

describe('AuthService', () => {
  let repository: IAuthRepository;
  let tokenStorage: ITokenStorage;
  let service: AuthService;

  beforeEach(() => {
    repository = {
      register: vi.fn().mockResolvedValue(response),
      login: vi.fn().mockResolvedValue(response),
      loginAsGuest: vi.fn().mockResolvedValue(response),
      getCurrentUser: vi.fn(),
      getDemoAccount: vi
        .fn()
        .mockResolvedValue({ email: 'demo@example.com', password: 'review-2026' }),
    };
    tokenStorage = { getToken: vi.fn(() => null), setToken: vi.fn(), clearToken: vi.fn() };
    service = new AuthService(repository, tokenStorage);
  });

  it('normalises the email and stores the token on login', async () => {
    await service.login({ email: '  Asha@Example.COM ', password: 'secret-pass' });

    expect(repository.login).toHaveBeenCalledWith({
      email: 'asha@example.com',
      password: 'secret-pass',
    });
    expect(tokenStorage.setToken).toHaveBeenCalledWith('token-123');
  });

  it('rejects a short password before calling the API', async () => {
    await expect(
      service.register({
        name: 'Asha',
        email: 'asha@example.com',
        password: 'short',
        confirmPassword: 'short',
      })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.register).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    await expect(service.login({ email: 'not-an-email', password: 'x' })).rejects.toThrow(
      /valid email/
    );
  });

  it('starts a guest session and clears it on logout', async () => {
    await service.loginAsGuest();
    service.logout();

    expect(tokenStorage.setToken).toHaveBeenCalledWith('token-123');
    expect(tokenStorage.clearToken).toHaveBeenCalled();
  });

  it('passes the published demo account through unchanged', async () => {
    await expect(service.getDemoAccount()).resolves.toEqual({
      email: 'demo@example.com',
      password: 'review-2026',
    });
  });

  it('refuses to create an account when the two passwords differ', async () => {
    await expect(
      service.register({
        name: 'Asha',
        email: 'asha@example.com',
        password: 'secret-pass',
        confirmPassword: 'secret-pas',
      })
    ).rejects.toThrow(/do not match/);
    expect(repository.register).not.toHaveBeenCalled();
  });

  it('sends only the API fields once the passwords match', async () => {
    await service.register({
      name: ' Asha ',
      email: 'Asha@Example.com',
      password: 'secret-pass',
      confirmPassword: 'secret-pass',
    });

    expect(repository.register).toHaveBeenCalledWith({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'secret-pass',
    });
  });
});
