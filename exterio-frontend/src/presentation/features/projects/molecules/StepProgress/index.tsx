import { cn } from '@/presentation/shared/utils/cn';
import {
  STUDIO_STEP_COUNT,
  completedSteps,
} from '@/presentation/features/projects/utils/projectList';

export interface StepProgressProps {
  step: number;
  label: string;
}

/** How far along a house is: five segments, one per studio step, and "Step 4 of 5 · Designing". */
export function StepProgress({ step, label }: StepProgressProps) {
  const filled = completedSteps(step);
  const text = `Step ${step} of ${STUDIO_STEP_COUNT} · ${label}`;

  return (
    <div className="space-y-2">
      <div
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={0}
        aria-valuemax={STUDIO_STEP_COUNT}
        aria-valuenow={filled}
        aria-valuetext={text}
        className="grid grid-cols-5 gap-1"
      >
        {Array.from({ length: STUDIO_STEP_COUNT }, (_, index) => (
          <span
            key={index}
            className={cn('h-1 rounded-full', index < filled ? 'bg-brand-700' : 'bg-stone-200')}
          />
        ))}
      </div>
      <p className="text-sm text-stone-600">{text}</p>
    </div>
  );
}
