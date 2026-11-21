import { describe, expect, it } from 'vitest';

import {
  getDefaultStep,
  getNextStep,
  getPreviousStep,
  isStudioStep,
} from '@/presentation/features/studio/utils/steps';
import type { Project } from '@/domain/models/project';

const emptyProject = { image: null, regions: [] } as unknown as Project;

describe('studio steps', () => {
  it('walks forward and back through the five steps', () => {
    expect(getNextStep('photo')).toBe('regions');
    expect(getNextStep('estimate')).toBeNull();
    expect(getPreviousStep('regions')).toBe('photo');
    expect(getPreviousStep('photo')).toBeNull();
  });

  it('recognises only real step names from the URL', () => {
    expect(isStudioStep('scale')).toBe(true);
    expect(isStudioStep('settings')).toBe(false);
    expect(isStudioStep(null)).toBe(false);
  });

  it('opens a project at the first thing still left to do', () => {
    const withPhoto = { ...emptyProject, image: { url: '/x.jpg' } } as unknown as Project;
    const withRegions = { ...withPhoto, regions: [{ id: 'r1' }] } as unknown as Project;

    expect(getDefaultStep(emptyProject)).toBe('photo');
    expect(getDefaultStep(withPhoto)).toBe('regions');
    expect(getDefaultStep(withRegions)).toBe('design');
  });
});
