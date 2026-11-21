import { useMemo, useRef, useState } from 'react';

import { cn } from '@/presentation/shared/utils/cn';
import { useLeaderLines } from '@/presentation/features/estimate/hooks/useLeaderLines';
import { PartCard } from '@/presentation/features/estimate/molecules/PartCard';
import type { PartGroup } from '@/presentation/features/estimate/utils/partGroups';

export interface EstimateDiagramProps {
  groups: readonly PartGroup[];
  imageUrl: string;
  imageAlt: string;
  caption: string;
}

/**
 * The estimate as a labelled drawing: the house in the middle, a card per kind of part on
 * either side, and a leader line from each card to a dot on that part. On narrow screens the
 * photo comes first and the cards stack under it, without lines.
 */
export function EstimateDiagram({ groups, imageUrl, imageAlt, caption }: EstimateDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [imageRevision, setImageRevision] = useState(0);
  const revision = useMemo(
    () => `${groups.map((group) => `${group.key}:${group.side}`).join('|')}#${imageRevision}`,
    [groups, imageRevision]
  );
  const { lines } = useLeaderLines(containerRef, revision);

  const left = groups.filter((group) => group.side === 'left');
  const right = groups.filter((group) => group.side === 'right');

  const column = (items: readonly PartGroup[]) => (
    <div className="flex flex-col gap-4">
      {items.map((group) => (
        <PartCard
          key={group.key}
          group={group}
          isActive={hovered === group.key}
          onHover={setHovered}
        />
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,20rem)] xl:gap-10"
    >
      <figure className="order-first lg:order-none lg:col-start-2 lg:row-start-1">
        <div className="relative">
          <img
            src={imageUrl}
            alt={imageAlt}
            onLoad={() => setImageRevision((value) => value + 1)}
            className="block h-auto w-full rounded-2xl bg-stone-100"
          />
          {groups.map((group) => (
            <span
              key={group.key}
              data-part-dot={group.key}
              aria-hidden
              onPointerEnter={() => setHovered(group.key)}
              onPointerLeave={() => setHovered(null)}
              className={cn(
                'absolute z-20 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-card transition-transform',
                hovered === group.key && 'scale-125'
              )}
              style={{
                left: `${group.anchor.x * 100}%`,
                top: `${group.anchor.y * 100}%`,
                backgroundColor: group.color,
              }}
            />
          ))}
        </div>
        <figcaption className="mt-4 text-center text-[15px] text-stone-500">{caption}</figcaption>
      </figure>

      <div className="lg:col-start-1 lg:row-start-1">{column(left)}</div>
      <div className="lg:col-start-3 lg:row-start-1">{column(right)}</div>

      {lines.length > 0 && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full overflow-visible lg:block"
        >
          {lines.map((line) => (
            <line
              key={line.key}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              strokeWidth={hovered === line.key ? 2 : 1.25}
              className={hovered === line.key ? 'stroke-stone-900' : 'stroke-stone-700'}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
