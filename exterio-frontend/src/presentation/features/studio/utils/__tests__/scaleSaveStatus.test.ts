import { describe, expect, it } from 'vitest';

import { scaleSaveStatus } from '@/presentation/features/studio/utils/scaleSaveStatus';

describe('scaleSaveStatus', () => {
  it('says what is missing before anything else', () => {
    expect(
      scaleSaveStatus({ problem: 'Enter the wall width.', isSaving: true, isSaved: true })
    ).toEqual({ tone: 'problem', text: 'Enter the wall width.' });
  });

  it('says it is saving while a save runs or is about to', () => {
    expect(scaleSaveStatus({ problem: null, isSaving: true, isSaved: true }).tone).toBe('saving');
  });

  it('confirms that estimates use a saved scale', () => {
    expect(scaleSaveStatus({ problem: null, isSaving: false, isSaved: true })).toEqual({
      tone: 'saved',
      text: 'Scale saves automatically. Estimates use it.',
    });
  });

  it('warns that estimates are rough before any scale is saved', () => {
    expect(scaleSaveStatus({ problem: null, isSaving: false, isSaved: false }).tone).toBe('unset');
  });
});
