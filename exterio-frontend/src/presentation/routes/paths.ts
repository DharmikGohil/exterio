export const STUDIO_STEPS = ['photo', 'regions', 'design', 'estimate'] as const;
/** The step the real-world size used to have; old links to it open the estimate's size view. */
export const LEGACY_SCALE_STEP = 'scale';
export type StudioStep = (typeof STUDIO_STEPS)[number];

/** Query parameters used by the Studio page. */
export const STUDIO_PARAMS = {
  step: 'step',
  design: 'design',
  /** A sub-view of a step: `breakdown` or `size` on the estimate. */
  view: 'view',
} as const;

export const ROUTES = {
  login: '/login',
  home: '/',
  projectPattern: '/projects/:projectId',
  project: (projectId: string, step?: StudioStep) =>
    `/projects/${encodeURIComponent(projectId)}${step ? `?${STUDIO_PARAMS.step}=${step}` : ''}`,
} as const;
