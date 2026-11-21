import { describe, expect, it } from 'vitest';

import { photorealOptions } from '@/presentation/features/design/utils/photoreal';

describe('photorealOptions', () => {
  it('offers nothing when the server has no renderer and nothing was rendered', () => {
    expect(photorealOptions(false, false)).toEqual({
      showsSourceSwitch: false,
      showsGenerate: false,
    });
  });

  it('offers the switch and the button when a renderer is configured', () => {
    expect(photorealOptions(true, false)).toEqual({
      showsSourceSwitch: true,
      showsGenerate: true,
    });
  });

  it('keeps an earlier render viewable after the renderer is switched off', () => {
    expect(photorealOptions(false, true)).toEqual({
      showsSourceSwitch: true,
      showsGenerate: false,
    });
  });
});
