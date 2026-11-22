import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  hasSeenTour,
  markPageTourSeen,
  placeTourCard,
  presentSteps,
  stepsForFirstVisit,
  stepsForReplay,
  type PageTour,
} from '@/presentation/shared/utils/guidedTour';

const TOUR: PageTour = {
  id: 'studio-design',
  intro: { id: 'studio-intro', steps: [{ title: 'Intro', body: '' }] },
  steps: [
    { title: 'Pick finishes', body: '' },
    { title: 'Render', body: '' },
  ],
};

const titles = (steps: { title: string }[] | null) => steps?.map((step) => step.title) ?? null;

describe('which steps a tour shows', () => {
  beforeEach(() => window.localStorage.clear());

  it('shows the introduction and the page steps on a first visit', () => {
    expect(titles(stepsForFirstVisit(TOUR))).toEqual(['Intro', 'Pick finishes', 'Render']);
  });

  it('leaves out an introduction already seen on another step', () => {
    markPageTourSeen({ id: 'studio-photo', intro: TOUR.intro, steps: [] });

    expect(titles(stepsForFirstVisit(TOUR))).toEqual(['Pick finishes', 'Render']);
  });

  it('shows nothing unasked once the page tour has been seen', () => {
    markPageTourSeen(TOUR);

    expect(stepsForFirstVisit(TOUR)).toBeNull();
    expect(hasSeenTour('studio-intro')).toBe(true);
  });

  it('always replays every step from the help button', () => {
    markPageTourSeen(TOUR);

    expect(titles(stepsForReplay(TOUR))).toEqual(['Intro', 'Pick finishes', 'Render']);
  });

  it('never starts by itself when the browser blocks storage', () => {
    const blocked = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(stepsForFirstVisit(TOUR)).toBeNull();
    blocked.mockRestore();
  });
});

describe('presentSteps', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('keeps centred steps and steps whose element is on the page, and drops the rest', () => {
    document.body.innerHTML = '<button data-tour="here">Here</button>';
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
      {} as DOMRect,
    ] as unknown as DOMRectList);

    const actual = presentSteps([
      { title: 'Welcome', body: '' },
      { target: 'here', title: 'Here', body: '' },
      { target: 'missing', title: 'Missing', body: '' },
    ]);

    expect(titles(actual)).toEqual(['Welcome', 'Here']);
  });
});

describe('placeTourCard', () => {
  const card = { width: 300, height: 150 };
  const viewport = { width: 1200, height: 800 };

  it('puts the card below the highlighted area when it fits', () => {
    const actual = placeTourCard({ top: 100, left: 500, width: 200, height: 40 }, card, viewport);

    expect(actual).toEqual({ top: 152, left: 450, side: 'below' });
  });

  it('puts the card above when there is no room below', () => {
    const actual = placeTourCard({ top: 600, left: 500, width: 200, height: 100 }, card, viewport);

    expect(actual).toEqual({ top: 438, left: 450, side: 'above' });
  });

  it('keeps the card on screen next to an element at the edge', () => {
    const actual = placeTourCard({ top: 100, left: 1150, width: 40, height: 40 }, card, viewport);

    expect(actual.left).toBe(1200 - 300 - 16);
  });

  it('centres the card when the step points at nothing', () => {
    const actual = placeTourCard(null, card, viewport);

    expect(actual).toEqual({ top: 325, left: 450, side: 'centre' });
  });

  it('goes beside a tall side panel, top edges aligned', () => {
    const actual = placeTourCard({ top: 100, left: 850, width: 330, height: 520 }, card, viewport);

    expect(actual).toEqual({ top: 100, left: 850 - 12 - 300, side: 'left' });
  });

  it('goes to the right of a tall element at the left edge', () => {
    const actual = placeTourCard({ top: 100, left: 20, width: 400, height: 520 }, card, viewport);

    expect(actual).toEqual({ top: 100, left: 432, side: 'right' });
  });

  it('sits over the lower part of an element with no room on any side', () => {
    const actual = placeTourCard({ top: 20, left: 100, width: 1000, height: 760 }, card, viewport);

    expect(actual.top).toBe(800 - 150 - 16);
  });
});
