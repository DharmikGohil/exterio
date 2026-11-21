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
  updatedAt: '2026-11-21T10:00:00Z',
};

function renderCard() {
  const onRename = vi.fn();
  const onDelete = vi.fn();
  render(
    <MemoryRouter>
      <ProjectCard project={project} onRename={onRename} onDelete={onDelete} />
    </MemoryRouter>
  );
  return { onRename, onDelete };
}

describe('ProjectCard', () => {
  it('links to the project', () => {
    renderCard();

    expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/p1');
  });

  it('renames from the home screen', async () => {
    const { onRename, onDelete } = renderCard();

    await userEvent.click(screen.getByRole('button', { name: 'Rename Patel residence' }));

    expect(onRename).toHaveBeenCalledWith(project);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('asks to delete', async () => {
    const { onDelete } = renderCard();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Patel residence' }));

    expect(onDelete).toHaveBeenCalledWith(project);
  });
});
