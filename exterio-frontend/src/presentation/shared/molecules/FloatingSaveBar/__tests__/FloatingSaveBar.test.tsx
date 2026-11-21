import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FloatingSaveBar } from '@/presentation/shared/molecules/FloatingSaveBar';

describe('FloatingSaveBar', () => {
  it('says there are unsaved changes and offers to save or discard them', async () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    render(
      <FloatingSaveBar
        onSave={onSave}
        onDiscard={onDiscard}
        isSaving={false}
        saveLabel="Save regions"
      />
    );

    expect(screen.getByRole('region', { name: 'Unsaved changes' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save regions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it('cannot discard while saving', () => {
    render(
      <FloatingSaveBar onSave={vi.fn()} onDiscard={vi.fn()} isSaving saveLabel="Save regions" />
    );

    expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
  });
});
