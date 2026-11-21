import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DropdownMenu } from '@/presentation/shared/molecules/DropdownMenu';

function renderMenu() {
  const onRename = vi.fn();
  const onDelete = vi.fn();
  render(
    <DropdownMenu
      label="Design actions"
      trigger="More"
      items={[
        { key: 'rename', label: 'Rename', onSelect: onRename },
        { key: 'delete', label: 'Delete', onSelect: onDelete, disabled: true, tone: 'danger' },
      ]}
    />
  );
  return { onRename, onDelete };
}

describe('DropdownMenu', () => {
  it('opens a menu, runs a choice and closes', async () => {
    const { onRename } = renderMenu();

    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));

    expect(onRename).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keeps disabled choices visible but inert', async () => {
    const { onDelete } = renderMenu();

    await userEvent.click(screen.getByRole('button', { name: 'More' }));

    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('closes on Escape and gives focus back to its button', async () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'More' });

    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('marks the current choice when it picks one of several', async () => {
    render(
      <DropdownMenu
        label="Designs"
        trigger="Designs"
        items={[
          { key: 'a', label: 'Warm stone', onSelect: vi.fn(), checked: true },
          { key: 'b', label: 'Cool grey', onSelect: vi.fn(), checked: false },
        ]}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Designs' }));

    expect(screen.getByRole('menuitemradio', { name: 'Warm stone' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });
});
