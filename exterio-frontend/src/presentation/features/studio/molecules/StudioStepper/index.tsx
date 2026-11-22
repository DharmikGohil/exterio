import { Icon, type IconName } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';
import { STUDIO_STEP_META } from '@/presentation/features/studio/utils/steps';
import { STUDIO_STEPS, type StudioStep } from '@/presentation/routes/paths';

/** The current step shows what it is about instead of its number. */
const STEP_ICONS: Record<StudioStep, IconName> = {
  photo: 'camera',
  regions: 'shapes',
  design: 'palette',
  scale: 'ruler',
  estimate: 'rupee',
};

export interface StudioStepperProps {
  currentStep: StudioStep;
  /** Steps after the photo stay locked until a photo exists. */
  hasPhoto: boolean;
  onStepChange: (step: StudioStep) => void;
}

/**
 * The five steps as pills on a pale green track: done steps are green with a check in a dark
 * circle, the current one is a raised white pill with its step's icon, upcoming ones show their
 * number. Any unlocked step can be jumped to.
 */
export function StudioStepper({ currentStep, hasPhoto, onStepChange }: StudioStepperProps) {
  const currentIndex = STUDIO_STEPS.indexOf(currentStep);

  return (
    <nav aria-label="Project steps" className="-mx-1 min-w-0 overflow-x-auto px-1 py-0.5">
      <ol className="flex min-w-max items-center gap-1 rounded-full bg-brand-50 p-1 ring-1 ring-brand-100">
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
                // The name stays readable on narrow screens, where only the circle shows.
                aria-label={meta.label}
                title={isLocked ? 'Upload a photo first' : meta.description}
                onClick={() => onStepChange(step)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-full pl-1 pr-3 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  isCurrent && 'bg-white text-stone-900 shadow-card ring-1 ring-stone-200',
                  !isCurrent && isDone && 'bg-brand-100 text-brand-900 hover:bg-brand-200',
                  !isCurrent && !isDone && 'text-stone-500 hover:bg-white/70 hover:text-stone-900'
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                    isCurrent || isDone
                      ? 'bg-brand-700 text-white'
                      : 'border border-stone-300 bg-white text-stone-500'
                  )}
                >
                  {isDone && <Icon name="check" className="h-3.5 w-3.5" />}
                  {isCurrent && <Icon name={STEP_ICONS[step]} className="h-3.5 w-3.5" />}
                  {!isDone && !isCurrent && <span className="tabular-nums">{index + 1}</span>}
                </span>
                <span className={cn(!isCurrent && 'hidden lg:inline')}>{meta.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
