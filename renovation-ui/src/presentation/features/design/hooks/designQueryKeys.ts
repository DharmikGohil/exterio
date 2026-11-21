export const DESIGN_QUERY_KEYS = {
  all: ['designs'] as const,
  detail: (designId: string) => [...DESIGN_QUERY_KEYS.all, 'detail', designId] as const,
  assignments: (designId: string) => [...DESIGN_QUERY_KEYS.all, 'assignments', designId] as const,
};
