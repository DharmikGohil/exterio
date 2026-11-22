import { Button } from '@/presentation/shared/atoms/Button';
import { useAdvisorDock } from '@/presentation/features/advisor/contexts/AdvisorDockContext';

/** "Ask about materials": opens the studio's advisor panel. Nothing when no advisor is set up. */
export function AdvisorButton() {
  const { isAvailable, isOpen, open } = useAdvisorDock();
  if (!isAvailable) {
    return null;
  }
  return (
    <Button
      variant="outline"
      icon="message"
      data-tour="advisor"
      onClick={open}
      aria-expanded={isOpen}
    >
      Ask about materials
    </Button>
  );
}
