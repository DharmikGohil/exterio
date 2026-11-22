import type { ProjectSummary } from '@/domain/models/project';

export type ProjectSort = 'recent' | 'name' | 'progress';

export const PROJECT_SORT_OPTIONS: readonly { value: ProjectSort; label: string }[] = [
  { value: 'recent', label: 'Recently edited' },
  { value: 'name', label: 'Name, A to Z' },
  { value: 'progress', label: 'Furthest along' },
];

export const STUDIO_STEP_COUNT = 4;

/** The houses whose name contains the search, in the chosen order. */
export function filterAndSortProjects(
  projects: readonly ProjectSummary[],
  query: string,
  sort: ProjectSort
): ProjectSummary[] {
  const needle = query.trim().toLocaleLowerCase();
  const matches = needle
    ? projects.filter((project) => project.name.toLocaleLowerCase().includes(needle))
    : [...projects];
  const byRecent = (a: ProjectSummary, b: ProjectSummary) => b.updatedAt.localeCompare(a.updatedAt);
  const compare: Record<ProjectSort, (a: ProjectSummary, b: ProjectSummary) => number> = {
    recent: byRecent,
    name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    progress: (a, b) => b.progressStep - a.progressStep || byRecent(a, b),
  };
  return matches.sort(compare[sort]);
}

/** Segments of the progress bar to fill: the steps done, and all of them once it is estimated. */
export function completedSteps(progressStep: number): number {
  return progressStep >= STUDIO_STEP_COUNT ? STUDIO_STEP_COUNT : Math.max(progressStep - 1, 0);
}
