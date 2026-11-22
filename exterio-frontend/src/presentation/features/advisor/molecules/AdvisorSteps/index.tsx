import { useState } from 'react';

import type { AdvisorStep } from '@/domain/models/advisor';
import { Icon, type IconName } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';

const STEP_ICONS: Record<string, IconName> = {
  notes: 'search',
  project: 'home',
  answer: 'edit',
};

export interface AdvisorStepsProps {
  steps: AdvisorStep[];
  /** While the answer is arriving every step is shown; afterwards they fold into one line. */
  isWorking: boolean;
}

/** The work behind an answer, step by step, like a research assistant showing its trail. */
export function AdvisorSteps({ steps, isWorking }: AdvisorStepsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (steps.length === 0) {
    return null;
  }

  if (!isWorking && !isExpanded) {
    const summary = steps
      .filter((step) => step.key !== 'answer')
      .map((step) => step.label)
      .join(' · ');
    return (
      <button
        type="button"
        aria-expanded={false}
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-1 rounded-md text-xs text-stone-500 transition-colors hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Icon name="check" className="h-3.5 w-3.5 text-brand-600" />
        {summary}
        <Icon name="chevron-right" className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="w-full max-w-[85%]">
      {!isWorking && (
        <button
          type="button"
          aria-expanded
          onClick={() => setIsExpanded(false)}
          className="mb-1.5 flex items-center gap-1 rounded-md text-xs text-stone-500 transition-colors hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          How this answer was put together
          <Icon name="chevron-down" className="h-3.5 w-3.5" />
        </button>
      )}
      <ol aria-label="Advisor steps" className="ml-2 space-y-2.5 border-l border-stone-200 pl-3">
        {steps.map((step) => {
          const isRunning = step.status === 'running';
          return (
            <li key={step.key} className="relative animate-fade-in">
              <span className="absolute -left-[21px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-white">
                {isRunning ? (
                  <Icon name="spinner" className="h-3.5 w-3.5 animate-spin text-brand-600" />
                ) : (
                  <Icon
                    name={STEP_ICONS[step.key] ?? 'check'}
                    className="h-3.5 w-3.5 text-stone-400"
                  />
                )}
              </span>
              <p
                className={cn(
                  'text-xs font-medium leading-4',
                  isRunning
                    ? 'animate-text-shimmer bg-text-shimmer bg-[length:200%_100%] bg-clip-text text-transparent'
                    : 'text-stone-700'
                )}
              >
                {step.label}
              </p>
              {step.detail && (
                <p
                  title={step.detail}
                  className="mt-0.5 line-clamp-2 text-xs leading-snug text-stone-500"
                >
                  {step.detail}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
