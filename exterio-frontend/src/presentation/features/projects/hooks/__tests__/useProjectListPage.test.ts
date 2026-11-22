import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProjectListPage } from '@/presentation/features/projects/hooks/useProjectListPage';

const navigate = vi.fn();
const createSampleProject = vi.fn();

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@/presentation/shared/hooks/useToast', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn() }),
}));
vi.mock('@/presentation/features/projects/hooks/useProjects', () => ({
  useProjects: () => ({ projects: [], isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('@/presentation/features/projects/hooks/useProjectListActions', () => ({
  useProjectListActions: () => ({
    createSampleProject,
    isCreatingSample: false,
    resetCreateState: vi.fn(),
    resetRenameState: vi.fn(),
  }),
}));

describe('useProjectListPage', () => {
  beforeEach(() => {
    navigate.mockReset();
    createSampleProject.mockReset();
  });

  it('opens a new sample house where its stage leaves off', async () => {
    createSampleProject.mockResolvedValue({ id: 'sample-1' });
    const { result } = renderHook(() => useProjectListPage());

    await act(() => result.current.createSampleProject());

    expect(navigate).toHaveBeenCalledWith('/projects/sample-1');
  });
});
