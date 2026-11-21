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

export function StudioStepper({ currentStep, hasPhoto, onStepChange }: StudioStepperProps) {
  const currentIndex = STUDIO_STEPS.indexOf(currentStep);

  return (
    <nav aria-label="Project steps" className="-mx-1 overflow-x-auto px-1">
      <ol className="flex min-w-max items-center">
        {STUDIO_STEPS.map((step, index) => {
          const meta = STUDIO_STEP_META[step];
          const isCurrent = step === currentStep;
          const isLocked = !hasPhoto && step !== 'photo';
          const isBehind = index < currentIndex;
          return (
            <li key={step} className="flex items-center">
              {index > 0 && (
                <span aria-hidden className="mx-1 h-px w-3 bg-stone-300 sm:mx-2 sm:w-5" />
              )}
              <button
                type="button"
                disabled={isLocked}
                aria-current={isCurrent ? 'step' : undefined}
                title={isLocked ? 'Upload a photo first' : meta.description}
                onClick={() => onStepChange(step)}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-lg px-2 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  isCurrent
                    ? 'bg-stone-100 font-medium text-stone-900'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded font-mono text-[11px]',
                    isCurrent && 'bg-brand-700 text-white',
                    !isCurrent && isBehind && 'text-stone-500',
                    !isCurrent && !isBehind && 'border border-stone-300 text-stone-500'
                  )}
                >
                  {isBehind && !isCurrent ? (
                    <Icon name="check" className="h-3.5 w-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className={cn(!isCurrent && 'hidden sm:inline')}>{meta.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
