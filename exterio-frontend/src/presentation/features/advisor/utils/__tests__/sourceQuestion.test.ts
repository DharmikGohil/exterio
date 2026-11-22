import { describe, expect, it } from 'vitest';

import { questionAboutSource } from '@/presentation/features/advisor/utils/sourceQuestion';

describe('questionAboutSource', () => {
  it('asks about the note by its title, for the user’s own house', () => {
    expect(questionAboutSource('Texture finish: hiding uneven plaster')).toBe(
      'Tell me more about “Texture finish: hiding uneven plaster” for my house.'
    );
  });
});
