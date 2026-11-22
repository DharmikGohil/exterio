import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Tooltip } from '@/presentation/shared/atoms/Tooltip';
import { useGuidedTour } from '@/presentation/shared/contexts/GuidedTourContext';

/** The header's help button: shows the current page's tour again. Hidden on pages without one. */
export function TourButton() {
  const { hasTour, isRunning, replay } = useGuidedTour();
  if (!hasTour) {
    return null;
  }
  return (
    <Tooltip content="Show me around" side="bottom" align="end">
      <Button
        size="icon"
        variant="ghost"
        className="h-9 w-9 text-stone-600"
        aria-label="Show me around this page"
        data-tour="tour-button"
        disabled={isRunning}
        onClick={replay}
      >
        <Icon name="info" />
      </Button>
    </Tooltip>
  );
}
