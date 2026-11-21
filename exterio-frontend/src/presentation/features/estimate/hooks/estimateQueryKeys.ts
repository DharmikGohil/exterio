export const ESTIMATE_QUERY_KEYS = {
  all: ['estimates'] as const,
  detail: (designId: string) => [...ESTIMATE_QUERY_KEYS.all, designId] as const,
};
