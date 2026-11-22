import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { Project } from '@/domain/models/project';
import { useStudioStep } from '@/presentation/features/studio/hooks/useStudioStep';

const PROJECT = {
  id: 'p1',
  image: { url: '/x.jpg' },
  regions: [{ id: 'r1' }],
  designs: [],
  scale: null,
} as unknown as Project;

function renderAt(url: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  );
  return renderHook(() => ({ studio: useStudioStep(PROJECT), location: useLocation() }), {
    wrapper,
  });
}

describe('useStudioStep', () => {
  it('opens an old link to the size step on the estimate, with the size open', () => {
    const { result } = renderAt('/projects/p1?step=scale');

    expect(result.current.studio.step).toBe('estimate');
    const params = new URLSearchParams(result.current.location.search);
    expect(params.get('step')).toBe('estimate');
    expect(params.get('view')).toBe('size');
  });

  it('opens marked parts at Design, size or no size', () => {
    const { result } = renderAt('/projects/p1');

    expect(result.current.studio.step).toBe('design');
  });
});
