import { describe, expect, it } from 'vitest';

import { revealPhrase } from '@/presentation/features/studio/utils/detectionReveal';

describe('revealPhrase', () => {
  it('describes what the AI is on, by the kind of part it just found', () => {
    expect(revealPhrase('wall')).toBe('Outlining the walls and roof');
    expect(revealPhrase('garage_door')).toBe('Finding windows, doors and the garage');
    expect(revealPhrase('railing')).toBe('Adding pillars, railings and gates');
    expect(revealPhrase('other')).toBe('Adding fences and extras');
  });
});
