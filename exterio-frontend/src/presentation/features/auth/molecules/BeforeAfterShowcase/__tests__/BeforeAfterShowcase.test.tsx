import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { BeforeAfterShowcase } from '@/presentation/features/auth/molecules/BeforeAfterShowcase';
import {
  LABEL_BOTTOM,
  SHOWCASE_HOUSES,
  labelSlots,
} from '@/presentation/features/auth/utils/showcase';

const [FIRST] = SHOWCASE_HOUSES;

describe('BeforeAfterShowcase', () => {
  it('shows the first house before and after, with its design and total', () => {
    render(<BeforeAfterShowcase />);

    expect(screen.getByAltText(`${FIRST.house} as it is today`)).toHaveAttribute(
      'src',
      `/showcase/${FIRST.key}-before.jpg`
    );
    expect(screen.getByAltText(`${FIRST.house} with the ${FIRST.design} design`)).toHaveAttribute(
      'src',
      `/showcase/${FIRST.key}-after.jpg`
    );
    expect(screen.getByText(`${FIRST.house} · ${FIRST.design}`)).toBeInTheDocument();
    expect(screen.getByText(/^Estimated ₹/)).toBeInTheDocument();
  });

  it('labels each finish with the parts it is on and what it costs', () => {
    render(<BeforeAfterShowcase />);

    const labels = within(screen.getByRole('list', { name: 'What changes and what it costs' }));
    for (const callout of FIRST.callouts) {
      expect(labels.getByText(callout.finish)).toBeInTheDocument();
      expect(labels.getByText(callout.parts)).toBeInTheDocument();
    }
  });

  it('moves to the next house when the sweep finishes, and wraps round', () => {
    render(<BeforeAfterShowcase />);

    for (let step = 0; step < SHOWCASE_HOUSES.length; step += 1) {
      fireEvent.animationEnd(screen.getByTestId('showcase-after'));
    }

    expect(screen.getByText(`${FIRST.house} · ${FIRST.design}`)).toBeInTheDocument();
  });

  it('goes straight to a house from its dot', async () => {
    const last = SHOWCASE_HOUSES[SHOWCASE_HOUSES.length - 1];
    render(<BeforeAfterShowcase />);

    await userEvent.click(screen.getByRole('button', { name: `Show the ${last.house}` }));

    expect(screen.getByText(`${last.house} · ${last.design}`)).toBeInTheDocument();
  });
});

describe('showcase data', () => {
  it.each(SHOWCASE_HOUSES.map((house) => [house.house, house] as const))(
    '%s has arrows that land inside the photo, below the labels',
    (_, house) => {
      expect(house.callouts.length).toBeGreaterThan(0);
      for (const callout of house.callouts) {
        expect(callout.x).toBeGreaterThan(0);
        expect(callout.x).toBeLessThan(1);
        expect(callout.y).toBeGreaterThan(LABEL_BOTTOM);
        expect(callout.y).toBeLessThan(1);
        expect(callout.cost).toBeGreaterThan(0);
      }
    }
  );

  it('gives labels distinct slots, left to right', () => {
    for (const count of [1, 2, 3]) {
      const slots = labelSlots(count);
      expect(slots).toHaveLength(count);
      expect([...slots].sort((a, b) => a - b)).toEqual(slots);
    }
  });
});
