export const AUTH_QUERY_KEYS = {
  all: ['auth'] as const,
  currentUser: () => [...AUTH_QUERY_KEYS.all, 'current-user'] as const,
  demoAccount: () => [...AUTH_QUERY_KEYS.all, 'demo-account'] as const,
};
