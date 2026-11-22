import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GuidedTourProvider,
  TOUR_AUTO_START_DELAY_MS,
  usePageTour,
} from '@/presentation/shared/contexts/GuidedTourContext';
import { TourButton } from '@/presentation/shared/molecules/TourButton';
import type { PageTour } from '@/presentation/shared/utils/guidedTour';

const TOUR: PageTour = {
  id: 'test-page',
  steps: [
    { title: 'Welcome', body: 'What this page is for.' },
    { target: 'new-thing', title: 'Make a new thing', body: 'Click here to start.' },
    { target: 'not-on-this-page', title: 'Hidden panel', body: 'Only in another state.' },
  ],
};

function Page() {
  usePageTour(TOUR);
  return (
    <>
      <TourButton />
      <button type="button" data-tour="new-thing">
        New thing
      </button>
    </>
  );
}

function renderPage() {
  return render(
    <GuidedTourProvider>
      <Page />
    </GuidedTourProvider>
  );
}

/** Past the start delay and the wait for missing elements (one step here is never present). */
function waitForAutoStart() {
  act(() => {
    vi.advanceTimersByTime(TOUR_AUTO_START_DELAY_MS + 4500);
  });
}

describe('the guided tour', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    // jsdom lays nothing out; treat every element as visible.
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
      {} as DOMRect,
    ] as unknown as DOMRectList);
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts by itself on the first visit and leaves out steps whose element is missing', () => {
    renderPage();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    waitForAutoStart();

    expect(screen.getByRole('dialog', { name: 'Welcome' })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('waits for an element that appears late, so its step is not left out', () => {
    function LatePage() {
      usePageTour(TOUR);
      const [shown, setShown] = useState(false);
      useEffect(() => {
        const timer = window.setTimeout(() => setShown(true), 1500);
        return () => window.clearTimeout(timer);
      }, []);
      return shown ? (
        <button type="button" data-tour="not-on-this-page">
          Late panel
        </button>
      ) : null;
    }
    render(
      <GuidedTourProvider>
        <LatePage />
      </GuidedTourProvider>
    );

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    // "new-thing" never appears on this page: the tour waits its full time, then starts.
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: 'Hidden panel' })).toBeInTheDocument();
  });

  it('moves forward and back, and finishes with Done', () => {
    renderPage();
    waitForAutoStart();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: 'Make a new thing' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('dialog', { name: 'Welcome' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is shown only once: after skipping, a new visit does not start it again', () => {
    const first = renderPage();
    waitForAutoStart();
    fireEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    first.unmount();

    renderPage();
    waitForAutoStart();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes with Esc', () => {
    renderPage();
    waitForAutoStart();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('replays from the help button after it has been seen', () => {
    window.localStorage.setItem('exterio.tourSeen.test-page', '1');
    renderPage();
    waitForAutoStart();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show me around this page' }));

    expect(screen.getByRole('dialog', { name: 'Welcome' })).toBeInTheDocument();
  });

  it('hides the help button on a page without a tour', () => {
    render(
      <GuidedTourProvider>
        <TourButton />
      </GuidedTourProvider>
    );

    expect(screen.queryByRole('button', { name: 'Show me around this page' })).toBeNull();
  });
});
