import { cn } from '@/presentation/shared/utils/cn';
import { formatInr } from '@/presentation/shared/utils/format';
import type { PartGroup } from '@/presentation/features/estimate/utils/partGroups';

export interface PartCardProps {
  group: PartGroup;
  /** Highlighted while its dot or line is hovered. */
  isActive?: boolean;
  onHover?: (label: PartGroup['label'] | null) => void;
}

/**
 * One kind of part in the estimate diagram: what goes on it, how much of it there is and what
 * it costs. A part with no finish yet is shown in amber as not in the estimate.
 */
export function PartCard({ group, isActive = false, onHover }: PartCardProps) {
  return (
    <article
      data-part-card={group.label}
      data-side={group.side}
      onPointerEnter={() => onHover?.(group.label)}
      onPointerLeave={() => onHover?.(null)}
      className={cn(
        'flex min-h-[10.5rem] flex-col rounded-2xl border p-5 transition-shadow',
        group.isUnpriced ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white',
        isActive && 'shadow-raised'
      )}
    >
      <h3 className="flex items-center gap-2.5 text-lg font-medium text-stone-900">
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-[3px]"
          style={{ backgroundColor: group.color }}
        />
        {group.title}
      </h3>
      <div
        className={cn(
          'mt-3 text-[15px] leading-snug',
          group.isUnpriced ? 'text-amber-900' : 'text-stone-600'
        )}
      >
        {group.finishLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>{group.measure}</p>
      </div>
      <p
        className={cn(
          'mt-auto pt-3 text-right',
          group.isUnpriced
            ? 'text-[15px] font-medium text-amber-800'
            : 'text-2xl font-medium tabular-nums text-stone-900'
        )}
      >
        {group.isUnpriced ? 'Not in estimate' : formatInr(group.totalCost)}
      </p>
    </article>
  );
}
