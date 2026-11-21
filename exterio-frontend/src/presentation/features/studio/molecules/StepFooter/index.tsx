import type { ReactNode } from 'react';

import { Button } from '@/presentation/shared/atoms/Button';
import { PAGE_FRAME_BLEED } from '@/presentation/shared/utils/pageFrame';
import {
  STUDIO_STEP_META,
  getNextStep,
  getPreviousStep,
} from '@/presentation/features/studio/utils/steps';
import { STUDIO_STEPS, type StudioStep } from '@/presentation/routes/paths';

export interface StepFooterProps {
  step: StudioStep;
  onStepChange: (step: StudioStep) => void;
  /** Shown next to the button, e.g. a reminder to save first. Also makes Continue secondary. */
  hint?: string;
  /** Replaces "Step n of 5 · Next, …" on the left. */
  meta?: string;
  /** The main action of the last step (which has no Continue), e.g. downloading the report. */
  primaryAction?: ReactNode;
}

/**
 * The step bar pinned to the bottom of the screen, so the way forward is always in view
 * without scrolling past a tall photo.
 */
export function StepFooter({ step, onStepChange, hint, meta, primaryAction }: StepFooterProps) {
  const nextStep = getNextStep(step);
  const previousStep = getPreviousStep(step);
  const position = STUDIO_STEPS.indexOf(step) + 1;

  return (
    <div
      className={`sticky bottom-0 z-30 border-t border-stone-200 bg-white py-3.5 ${PAGE_FRAME_BLEED}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="hidden text-sm text-stone-500 sm:block">
          {meta ?? (
            <>
              Step {position} of {STUDIO_STEPS.length}
              {nextStep && ` · Next, ${STUDIO_STEP_META[nextStep].label.toLowerCase()}`}
            </>
          )}
        </p>
        <div className="ml-auto flex items-center gap-2">
          {hint && <p className="hidden text-sm text-stone-600 md:block">{hint}</p>}
          {previousStep && (
            <Button variant="ghost" icon="arrow-left" onClick={() => onStepChange(previousStep)}>
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          {nextStep && (
            <Button variant={hint ? 'outline' : 'primary'} onClick={() => onStepChange(nextStep)}>
              Continue to {STUDIO_STEP_META[nextStep].label.toLowerCase()}
              <span aria-hidden>→</span>
            </Button>
          )}
          {primaryAction}
        </div>
      </div>
    </div>
  );
}
