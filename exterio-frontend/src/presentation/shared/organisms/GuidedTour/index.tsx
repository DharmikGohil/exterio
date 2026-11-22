import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/presentation/shared/atoms/Button';
import {
  findTourTarget,
  placeTourCard,
  spotlightRect,
  type TourRect,
  type TourStep,
} from '@/presentation/shared/utils/guidedTour';
import { prefersReducedMotion } from '@/presentation/shared/utils/motion';

export interface GuidedTourProps {
  steps: TourStep[];
  index: number;
  onNext: () => void;
  onBack: () => void;
  /** Finishing and skipping both close the tour. */
  onClose: () => void;
}

/** The dimmed page around the highlighted element: the app's dark green ink. */
const BACKDROP = 'rgb(16 36 29 / 0.6)';

/** Until the card has been measured: its usual size, so the first frame is already close. */
const ESTIMATED_CARD = { width: 352, height: 200 };

function measure(target: string | undefined): TourRect | null {
  const element = target ? findTourTarget(target) : null;
  if (!element) {
    return null;
  }
  const { top, left, width, height } = element.getBoundingClientRect();
  return spotlightRect({ top, left, width, height });
}

/**
 * One step of a guided tour: the page dimmed except for the element the step is about, and a
 * card beside it with what it is for, the step count, and Back, Next and Skip. Esc skips, the
 * arrow keys move between steps. The page underneath cannot be clicked while the tour is open.
 */
export function GuidedTour({ steps, index, onNext, onBack, onClose }: GuidedTourProps) {
  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const titleId = useId();
  const bodyId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [spotlight, setSpotlight] = useState<TourRect | null>(null);
  const [card, setCard] = useState(ESTIMATED_CARD);
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const remeasure = useCallback(() => {
    setSpotlight(measure(step?.target));
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    const box = cardRef.current?.getBoundingClientRect();
    if (box && box.width > 0) {
      setCard({ width: box.width, height: box.height });
    }
  }, [step?.target]);

  // Bring the element into view, then measure; again after a smooth scroll has settled.
  useLayoutEffect(() => {
    const element = step?.target ? findTourTarget(step.target) : null;
    element?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
    remeasure();
    const settled = window.setTimeout(remeasure, 400);
    return () => window.clearTimeout(settled);
  }, [step?.target, remeasure]);

  useEffect(() => {
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(remeasure);
    };
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [remeasure]);

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (isLast) {
          onClose();
        } else {
          onNext();
        }
      } else if (event.key === 'ArrowLeft' && !isFirst) {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFirst, isLast, onBack, onClose, onNext]);

  if (!step) {
    return null;
  }

  const placement = placeTourCard(spotlight, card, viewport);
  const motion = prefersReducedMotion() ? '' : 'transition-all duration-300 ease-out';

  return createPortal(
    <div className="fixed inset-0 z-[60]" data-testid="guided-tour">
      {spotlight ? (
        <div
          aria-hidden
          className={`pointer-events-none fixed rounded-xl ring-2 ring-white/90 ${motion}`}
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: `0 0 0 9999px ${BACKDROP}`,
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0" style={{ backgroundColor: BACKDROP }} />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className={`fixed w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-white p-5 shadow-raised ${motion}`}
        style={{ top: placement.top, left: placement.left }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">
          {steps.length > 1 ? `Step ${index + 1} of ${steps.length}` : 'Quick tip'}
        </p>
        <h2 id={titleId} className="mt-1.5 text-lg font-medium leading-snug text-stone-900">
          {step.title}
        </h2>
        <p id={bodyId} className="mt-1.5 text-[15px] leading-relaxed text-stone-600">
          {step.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          {isLast ? (
            <span />
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip tour
            </Button>
          )}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={onBack}>
                Back
              </Button>
            )}
            <Button ref={primaryRef} size="sm" onClick={isLast ? onClose : onNext}>
              {isLast ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>

        {steps.length > 1 && (
          <div aria-hidden className="mt-4 flex justify-center gap-1.5">
            {steps.map((item, position) => (
              <span
                key={`${item.title}-${position}`}
                className={`h-1.5 rounded-full ${position === index ? 'w-4 bg-brand-700' : 'w-1.5 bg-stone-300'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
