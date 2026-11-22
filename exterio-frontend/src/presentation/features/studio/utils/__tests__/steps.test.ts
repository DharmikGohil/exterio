import { describe, expect, it } from 'vitest';

import {
  getDefaultStep,
  getNextStep,
  getPreviousStep,
  isStudioStep,
} from '@/presentation/features/studio/utils/steps';
import type { Project } from '@/domain/models/project';

const emptyProject = { image: null, regions: [], designs: [], scale: null } as unknown as Project;

describe('studio steps', () => {
  it('walks forward and back through the five steps', () => {
    expect(getNextStep('photo')).toBe('regions');
    expect(getNextStep('estimate')).toBeNull();
    expect(getPreviousStep('regions')).toBe('photo');
    expect(getPreviousStep('photo')).toBeNull();
    expect(getNextStep('design')).toBe('scale');
    expect(getNextStep('scale')).toBe('estimate');
  });

  it('recognises only real step names from the URL', () => {
    expect(isStudioStep('scale')).toBe(true);
    expect(isStudioStep('settings')).toBe(false);
    expect(isStudioStep(null)).toBe(false);
  });

  it('opens a project at the first thing still left to do', () => {
    const withPhoto = { ...emptyProject, image: { url: '/x.jpg' } } as unknown as Project;
    const withRegions = { ...withPhoto, regions: [{ id: 'r1' }] } as unknown as Project;
    const withSize = { ...withRegions, scale: { method: 'facade_dimensions' } } as Project;
    const designedRough = {
      ...withRegions,
      designs: [{ id: 'd1', assignments: { r1: 'paint-warm-cream' } }],
    } as unknown as Project;
    const designed = {
      ...withSize,
      designs: [{ id: 'd1', assignments: { r1: 'paint-warm-cream' } }],
    } as unknown as Project;
    const finishOnDeletedPart = {
      ...withSize,
      designs: [{ id: 'd1', assignments: { gone: 'paint-warm-cream' } }],
    } as unknown as Project;

    expect(getDefaultStep(emptyProject)).toBe('photo');
    expect(getDefaultStep(withPhoto)).toBe('regions');
    expect(getDefaultStep(withRegions)).toBe('design');
    expect(getDefaultStep(withSize)).toBe('design');
    expect(getDefaultStep(designedRough)).toBe('scale');
    expect(getDefaultStep(designed)).toBe('estimate');
    expect(getDefaultStep(finishOnDeletedPart)).toBe('design');
  });

  it('shows a bare photo whose check has not been seen here, then moves on to its parts', () => {
    const withPhoto = { ...emptyProject, image: { url: '/x.jpg' } } as unknown as Project;
    const withRegions = { ...withPhoto, regions: [{ id: 'r1' }] } as unknown as Project;

    expect(getDefaultStep(withPhoto, false)).toBe('photo');
    expect(getDefaultStep(withPhoto, true)).toBe('regions');
    expect(getDefaultStep(withRegions, false)).toBe('design');
  });
});
