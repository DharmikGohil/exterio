import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ProjectCard } from '@/presentation/features/projects/molecules/ProjectCard';
import type { ProjectSummary } from '@/domain/models/project';

const project: ProjectSummary = {
  id: 'p1',
  name: 'Patel residence',
  thumbnailUrl: null,
  designCount: 2,
  progressStep: 3,
  progressLabel: 'Designing',
  estimateTotal: null,
  updatedAt: '2026-11-21T10:00:00Z',
};

function renderCard(patch: Partial<ProjectSummary> = {}) {
  const onRename = vi.fn();
  const onDelete = vi.fn();
  render(
    <MemoryRouter>
      <ProjectCard project={{ ...project, ...patch }} onRename={onRename} onDelete={onDelete} />
    </MemoryRouter>
  );
  return { onRename, onDelete };
}

describe('ProjectCard', () => {
  it('links to the project', () => {
    renderCard();

    expect(screen.getByRole('link', { name: 'Patel residence' })).toHaveAttribute(
      'href',
      '/projects/p1'
    );
  });

  it('shows how far along the house is', () => {
    renderCard();

    expect(screen.getByText('Step 3 of 4 · Designing')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByText(/2 designs · edited/)).toBeInTheDocument();
  });

  it('shows the total once there is an estimate, and says so when there is none', () => {
    renderCard();
    expect(screen.getByText('No estimate yet')).toBeInTheDocument();
  });

  it('shows the estimate total', () => {
    renderCard({ estimateTotal: 68610, progressStep: 4, progressLabel: 'Estimate ready' });

    expect(screen.getByText('₹68,610')).toBeInTheDocument();
  });

  it('renames and deletes from the ⋯ menu', async () => {
    const { onRename, onDelete } = renderCard();
    const openMenu = () =>
      userEvent.click(screen.getByRole('button', { name: 'More actions for Patel residence' }));

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: /Rename/ }));
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));

    expect(onRename).toHaveBeenCalledWith(project);
    expect(onDelete).toHaveBeenCalledWith(project);
  });
});
