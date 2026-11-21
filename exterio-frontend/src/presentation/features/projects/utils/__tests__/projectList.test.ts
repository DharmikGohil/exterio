import { describe, expect, it } from 'vitest';

import {
  completedSteps,
  filterAndSortProjects,
} from '@/presentation/features/projects/utils/projectList';
import type { ProjectSummary } from '@/domain/models/project';

function project(name: string, progressStep: number, updatedAt: string): ProjectSummary {
  return {
    id: name,
    name,
    thumbnailUrl: null,
    designCount: 1,
    progressStep,
    progressLabel: '',
    estimateTotal: null,
    updatedAt,
  };
}

const PROJECTS = [
  project('patel residence', 2, '2026-11-20T10:00:00Z'),
  project('Shah villa', 5, '2026-11-19T10:00:00Z'),
  project('Mehta house', 4, '2026-11-22T10:00:00Z'),
];

const names = (items: ProjectSummary[]) => items.map((item) => item.name);

describe('filterAndSortProjects', () => {
  it('puts the most recently edited first', () => {
    expect(names(filterAndSortProjects(PROJECTS, '', 'recent'))).toEqual([
      'Mehta house',
      'patel residence',
      'Shah villa',
    ]);
  });

  it('sorts by name regardless of case', () => {
    expect(names(filterAndSortProjects(PROJECTS, '', 'name'))).toEqual([
      'Mehta house',
      'patel residence',
      'Shah villa',
    ]);
  });

  it('puts the furthest along first', () => {
    expect(names(filterAndSortProjects(PROJECTS, '', 'progress'))).toEqual([
      'Shah villa',
      'Mehta house',
      'patel residence',
    ]);
  });

  it('keeps the houses whose name contains the search', () => {
    expect(names(filterAndSortProjects(PROJECTS, '  SHAH ', 'recent'))).toEqual(['Shah villa']);
  });
});

describe('completedSteps', () => {
  it.each([
    [1, 0],
    [2, 1],
    [4, 3],
    [5, 5],
  ])('fills %i as %i segments', (step, filled) => {
    expect(completedSteps(step)).toBe(filled);
  });
});
