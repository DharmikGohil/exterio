import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RENDER_HINT, RenderButton } from '@/presentation/features/design/molecules/RenderButton';

describe('RenderButton', () => {
  it('generates a render, explaining what it does in a tooltip', async () => {
    const onGenerate = vi.fn();
    render(<RenderButton status="none" isRequesting={false} onGenerate={onGenerate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Generate render' }));

    expect(onGenerate).toHaveBeenCalledOnce();
    expect(screen.getByRole('tooltip')).toHaveTextContent(RENDER_HINT);
  });

  it('offers to regenerate once a render exists', () => {
    render(<RenderButton status="done" isRequesting={false} onGenerate={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Regenerate render' })).toBeEnabled();
  });

  it('cannot be pressed again while a render is running', () => {
    render(<RenderButton status="pending" isRequesting={false} onGenerate={vi.fn()} />);

    expect(screen.getByRole('button', { name: /rendering/i })).toBeDisabled();
  });
});
