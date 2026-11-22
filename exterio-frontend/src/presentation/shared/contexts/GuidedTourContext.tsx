import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { GuidedTour } from '@/presentation/shared/organisms/GuidedTour';
import {
  markPageTourSeen,
  presentSteps,
  stepsForFirstVisit,
  stepsForReplay,
  type PageTour,
  type TourStep,
} from '@/presentation/shared/utils/guidedTour';

/** Lets the page draw itself (and its data arrive) before the first tour points at it. */
export const TOUR_AUTO_START_DELAY_MS = 700;
/** How long a first-visit tour waits for all its elements before starting with those present. */
const TOUR_AUTO_START_WAIT_MS = 4000;
const TOUR_AUTO_START_RETRY_MS = 300;

interface TourRun {
  tour: PageTour;
  steps: TourStep[];
  index: number;
}

interface GuidedTourContextType {
  hasTour: boolean;
  isRunning: boolean;
  registerPageTour: (tour: PageTour | null) => void;
  replay: () => void;
}

const GuidedTourContext = createContext<GuidedTourContextType | undefined>(undefined);

/**
 * Holds the tour of the page on screen. A page names its tour with `usePageTour`; the tour starts
 * by itself the first time that page is opened in this browser, and the header's help button
 * (`useGuidedTour().replay`) shows it again at any time.
 */
export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const [pageTour, setPageTour] = useState<PageTour | null>(null);
  const [run, setRun] = useState<TourRun | null>(null);

  const start = useCallback((tour: PageTour, steps: TourStep[]) => {
    const shown = presentSteps(steps);
    if (shown.length === 0) {
      return;
    }
    setRun({ tour, steps: shown, index: 0 });
  }, []);

  const close = useCallback(() => {
    setRun((current) => {
      if (current) {
        markPageTourSeen(current.tour);
      }
      return null;
    });
  }, []);

  const next = useCallback(() => {
    setRun((current) =>
      current ? { ...current, index: Math.min(current.index + 1, current.steps.length - 1) } : null
    );
  }, []);

  const back = useCallback(() => {
    setRun((current) => (current ? { ...current, index: Math.max(current.index - 1, 0) } : null));
  }, []);

  const replay = useCallback(() => {
    if (pageTour) {
      start(pageTour, stepsForReplay(pageTour));
    }
  }, [pageTour, start]);

  useEffect(() => {
    if (!pageTour) {
      return undefined;
    }
    const steps = stepsForFirstVisit(pageTour);
    if (!steps) {
      return undefined;
    }
    // Parts of a page appear in their own time (a photo fading in, data arriving): wait until
    // every step's element is there, up to a limit, then show the steps that can be shown.
    const deadline = Date.now() + TOUR_AUTO_START_WAIT_MS;
    let timer = 0;
    const tryStart = () => {
      if (presentSteps(steps).length === steps.length || Date.now() >= deadline) {
        start(pageTour, steps);
      } else {
        timer = window.setTimeout(tryStart, TOUR_AUTO_START_RETRY_MS);
      }
    };
    timer = window.setTimeout(tryStart, TOUR_AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pageTour, start]);

  const value = useMemo(
    () => ({
      hasTour: pageTour !== null,
      isRunning: run !== null,
      registerPageTour: setPageTour,
      replay,
    }),
    [pageTour, run, replay]
  );

  return (
    <GuidedTourContext.Provider value={value}>
      {children}
      {run && (
        <GuidedTour
          steps={run.steps}
          index={run.index}
          onNext={next}
          onBack={back}
          onClose={close}
        />
      )}
    </GuidedTourContext.Provider>
  );
}

export function useGuidedTour(): GuidedTourContextType {
  const context = useContext(GuidedTourContext);
  if (!context) {
    throw new Error('useGuidedTour must be used inside a GuidedTourProvider');
  }
  return context;
}

/**
 * Names the tour of the page that calls it, while that page is shown. Pass a constant (or a
 * memoised value): a new object starts the tour's first-visit check again. Pass null while the
 * page is still loading, so the tour does not point at skeletons.
 */
export function usePageTour(tour: PageTour | null): void {
  const { registerPageTour } = useGuidedTour();
  useEffect(() => {
    registerPageTour(tour);
    return () => registerPageTour(null);
  }, [tour, registerPageTour]);
}
