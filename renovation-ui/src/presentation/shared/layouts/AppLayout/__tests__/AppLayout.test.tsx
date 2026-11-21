import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppLayout } from '@/presentation/shared/layouts/AppLayout';
import { PAGE_FRAME } from '@/presentation/shared/utils/pageFrame';

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout homeHref="/" headerRight={<span>Menu</span>} />}>
          <Route index element={<p>Page content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  it('renders the routed page on the quiet page grid, with no rulers', () => {
    renderLayout();

    expect(screen.getByRole('main')).toContainElement(screen.getByText('Page content'));
    const grid = screen.getByTestId('page-grid');
    expect(grid).toHaveClass('fixed', 'bg-stone-50', 'bg-paper-grid');
    // The loud green mat belongs to the estimate total and the sign-in story only.
    expect(grid).not.toHaveClass('bg-mat');
    expect(screen.queryByTestId('mat-ruler-top')).not.toBeInTheDocument();
  });

  it('shows the header slot on the right of the header', () => {
    renderLayout();

    expect(screen.getByRole('banner')).toHaveTextContent('Menu');
  });

  it('spreads the header and the page across the same full-width frame', () => {
    renderLayout();

    expect(PAGE_FRAME).not.toMatch(/max-w-/);
    for (const frameClass of PAGE_FRAME.split(' ')) {
      expect(screen.getByRole('main')).toHaveClass(frameClass);
      expect(screen.getByRole('banner')).toHaveClass(frameClass);
    }
  });
});
