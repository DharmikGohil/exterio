import { Button } from '@/presentation/shared/atoms/Button';

export interface NameTagToggleProps {
  isOn: boolean;
  onToggle: () => void;
}

/** Shows or hides the region name tags drawn on the photo. */
export function NameTagToggle({ isOn, onToggle }: NameTagToggleProps) {
  return (
    <Button
      size="sm"
      variant="ghost"
      icon="layers"
      aria-pressed={isOn}
      onClick={onToggle}
      className={isOn ? 'text-stone-900' : 'text-stone-500'}
    >
      {isOn ? 'Hide names' : 'Show names'}
    </Button>
  );
}
