export const STUDIO_STEPS = ['photo', 'regions', 'scale', 'design', 'estimate'] as const;
export type StudioStep = (typeof STUDIO_STEPS)[number];

/** Query parameters used by the Studio page. */
export const STUDIO_PARAMS = {
  step: 'step',
  design: 'design',
  /** A sub-view of a step, e.g. `breakdown` on the estimate. */
  view: 'view',
} as const;

export const ROUTES = {
  login: '/login',
  home: '/',
  projectPattern: '/projects/:projectId',
  project: (projectId: string, step?: StudioStep) =>
    `/projects/${encodeURIComponent(projectId)}${step ? `?${STUDIO_PARAMS.step}=${step}` : ''}`,
} as const;
