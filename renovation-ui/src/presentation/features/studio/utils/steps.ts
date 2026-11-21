import type { Project } from '@/domain/models/project';
import { STUDIO_STEPS, type StudioStep } from '@/presentation/routes/paths';

export interface StudioStepMeta {
  label: string;
  /** One line under the step title. */
  description: string;
}

export const STUDIO_STEP_META: Record<StudioStep, StudioStepMeta> = {
  photo: {
    label: 'Photo',
    description: 'Upload a clear, front-facing photo of the house.',
  },
  regions: {
    label: 'Regions',
    description: 'Mark the parts of the house: walls, windows, pillars and more.',
  },
  scale: {
    label: 'Scale',
    description: 'Tell us one real measurement so areas come out in feet.',
  },
  design: {
    label: 'Design',
    description: 'Apply finishes to each part and see the house change.',
  },
  estimate: {
    label: 'Estimate',
    description: 'Quantities, costs and a PDF report for your contractor.',
  },
};

export function isStudioStep(value: string | null): value is StudioStep {
  return value !== null && (STUDIO_STEPS as readonly string[]).includes(value);
}

/** Where to land when the URL does not name a step: the first thing still left to do. */
export function getDefaultStep(project: Project): StudioStep {
  if (!project.image) {
    return 'photo';
  }
  if (project.regions.length === 0) {
    return 'regions';
  }
  return 'design';
}

export function getNextStep(step: StudioStep): StudioStep | null {
  return STUDIO_STEPS[STUDIO_STEPS.indexOf(step) + 1] ?? null;
}

export function getPreviousStep(step: StudioStep): StudioStep | null {
  const index = STUDIO_STEPS.indexOf(step);
  return index > 0 ? STUDIO_STEPS[index - 1] : null;
}
