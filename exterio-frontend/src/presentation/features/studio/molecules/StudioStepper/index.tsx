import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';
import { STUDIO_STEP_META } from '@/presentation/features/studio/utils/steps';
import { STUDIO_STEPS, type StudioStep } from '@/presentation/routes/paths';

export interface StudioStepperProps {
  currentStep: StudioStep;
  /** Steps after the photo stay locked until a photo exists. */
  hasPhoto: boolean;
  onStepChange: (step: StudioStep) => void;
}

/**
 * The five steps as plain text: done steps carry a check, the current one is a green pill with
 * its number, upcoming ones show their number. Any unlocked step can be jumped to.
 */
export function StudioStepper({ currentStep, hasPhoto, onStepChange }: StudioStepperProps) {
  const currentIndex = STUDIO_STEPS.indexOf(currentStep);

  return (
    <nav aria-label="Project steps" className="-mx-1 min-w-0 overflow-x-auto px-1">
      <ol className="flex min-w-max items-center gap-1">
        {STUDIO_STEPS.map((step, index) => {
          const meta = STUDIO_STEP_META[step];
          const isCurrent = step === currentStep;
          const isLocked = !hasPhoto && step !== 'photo';
          const isDone = index < currentIndex;
          return (
            <li key={step}>
              <button
                type="button"
                disabled={isLocked}
                aria-current={isCurrent ? 'step' : undefined}
                title={isLocked ? 'Upload a photo first' : meta.description}
                onClick={() => onStepChange(step)}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-full px-3 text-[15px] transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  isCurrent && 'bg-brand-700 font-medium text-white',
                  !isCurrent && isDone && 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
                  !isCurrent && !isDone && 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                )}
              >
                {isDone ? (
                  <Icon name="check" className="h-3.5 w-3.5" />
                ) : (
                  <span className="tabular-nums">{index + 1}</span>
                )}
                <span className={cn(!isCurrent && 'hidden lg:inline')}>{meta.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
