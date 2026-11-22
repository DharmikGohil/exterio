/**
 * The guided tour: short steps that point at one part of the page each, shown automatically the
 * first time a page is opened in this browser and again whenever the user asks for it.
 *
 * A step points at an element by its `data-tour` attribute. A step whose element is not on the
 * page (a button that only shows in some states, a panel that is still loading) is left out, so
 * one tour can describe a page in all its states.
 */

export interface TourStep {
  /** The `data-tour` value of the element to point at. Without one, the step is a centred card. */
  target?: string;
  title: string;
  body: string;
}

export interface TourSection {
  /** Remembered in this browser once the tour that showed it is finished or skipped. */
  id: string;
  steps: TourStep[];
}

export interface PageTour extends TourSection {
  /**
   * Shown before the page's own steps the first time any page that shares it is opened (the
   * studio's five steps share one introduction), and always on a replay.
   */
  intro?: TourSection;
}

export interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TourCardPlacement {
  top: number;
  left: number;
  side: 'below' | 'above' | 'left' | 'right' | 'centre';
}

export const TOUR_ATTRIBUTE = 'data-tour';

/** Space between the highlighted element and its outline. */
export const SPOTLIGHT_PADDING_PX = 8;

const KEY_PREFIX = 'exterio.tourSeen.';
const CARD_GAP_PX = 12;
const SCREEN_MARGIN_PX = 16;

export function hasSeenTour(id: string): boolean {
  try {
    return window.localStorage.getItem(KEY_PREFIX + id) === '1';
  } catch {
    // Storage blocked: never start a tour that could not be dismissed for good.
    return true;
  }
}

export function markTourSeen(id: string): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + id, '1');
  } catch {
    // Storage blocked: nothing to remember; the help button still replays the tour.
  }
}

/** Marks the page's tour, and its introduction if it has one, as seen. */
export function markPageTourSeen(tour: PageTour): void {
  markTourSeen(tour.id);
  if (tour.intro) {
    markTourSeen(tour.intro.id);
  }
}

/** The steps to show unasked, or null when this browser has already seen the page's tour. */
export function stepsForFirstVisit(tour: PageTour): TourStep[] | null {
  if (hasSeenTour(tour.id)) {
    return null;
  }
  const intro = tour.intro && !hasSeenTour(tour.intro.id) ? tour.intro.steps : [];
  return [...intro, ...tour.steps];
}

/** Every step, for the help button. */
export function stepsForReplay(tour: PageTour): TourStep[] {
  return [...(tour.intro?.steps ?? []), ...tour.steps];
}

/** The first visible element marked with this tour target, if any. */
export function findTourTarget(target: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[${TOUR_ATTRIBUTE}="${target}"]`);
  return Array.from(candidates).find((element) => element.getClientRects().length > 0) ?? null;
}

/** The steps that can be shown now: centred cards, and steps whose element is on the page. */
export function presentSteps(steps: TourStep[]): TourStep[] {
  return steps.filter((step) => !step.target || findTourTarget(step.target) !== null);
}

/** The highlighted area: the element plus a little room around it. */
export function spotlightRect(rect: TourRect): TourRect {
  return {
    top: rect.top - SPOTLIGHT_PADDING_PX,
    left: rect.left - SPOTLIGHT_PADDING_PX,
    width: rect.width + SPOTLIGHT_PADDING_PX * 2,
    height: rect.height + SPOTLIGHT_PADDING_PX * 2,
  };
}

/**
 * Where the step's card goes, inside the screen with a margin so it never covers the edges on a
 * phone. Centred when there is nothing to point at. Next to a short element (a button, a row of
 * tools): below it, else above it. Next to a tall one (the photo, a side panel, more than half
 * the screen high): beside it, left then right, so it covers none of it. Whichever side fits
 * first wins; with no room on any side, the card sits over the element's lower part.
 */
export function placeTourCard(
  spotlight: TourRect | null,
  card: { width: number; height: number },
  viewport: { width: number; height: number }
): TourCardPlacement {
  const clampLeft = (left: number) =>
    Math.min(
      Math.max(left, SCREEN_MARGIN_PX),
      Math.max(SCREEN_MARGIN_PX, viewport.width - card.width - SCREEN_MARGIN_PX)
    );
  const clampTop = (top: number) =>
    Math.min(
      Math.max(top, SCREEN_MARGIN_PX),
      Math.max(SCREEN_MARGIN_PX, viewport.height - card.height - SCREEN_MARGIN_PX)
    );

  if (spotlight === null) {
    return {
      top: clampTop((viewport.height - card.height) / 2),
      left: clampLeft((viewport.width - card.width) / 2),
      side: 'centre',
    };
  }

  const centredLeft = clampLeft(spotlight.left + spotlight.width / 2 - card.width / 2);
  const below: TourCardPlacement = {
    top: spotlight.top + spotlight.height + CARD_GAP_PX,
    left: centredLeft,
    side: 'below',
  };
  const above: TourCardPlacement = {
    top: spotlight.top - CARD_GAP_PX - card.height,
    left: centredLeft,
    side: 'above',
  };
  const leftOf: TourCardPlacement = {
    top: clampTop(spotlight.top),
    left: spotlight.left - CARD_GAP_PX - card.width,
    side: 'left',
  };
  const rightOf: TourCardPlacement = {
    top: clampTop(spotlight.top),
    left: spotlight.left + spotlight.width + CARD_GAP_PX,
    side: 'right',
  };
  const fits = (place: TourCardPlacement) =>
    place.top >= SCREEN_MARGIN_PX &&
    place.top + card.height <= viewport.height - SCREEN_MARGIN_PX &&
    place.left >= SCREEN_MARGIN_PX &&
    place.left + card.width <= viewport.width - SCREEN_MARGIN_PX;

  const isTall = spotlight.height > viewport.height / 2;
  const order = isTall ? [leftOf, rightOf, below, above] : [below, above, leftOf, rightOf];
  return (
    order.find(fits) ?? {
      top: clampTop(viewport.height - card.height),
      left: centredLeft,
      side: 'below',
    }
  );
}
