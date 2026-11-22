import { useEffect, useState } from 'react';

import { formatInr } from '@/presentation/shared/utils/format';
import { cn } from '@/presentation/shared/utils/cn';
import {
  LABEL_BOTTOM,
  LABEL_WIDTH,
  SHOWCASE_HOUSES,
  labelSlots,
  showcaseImage,
  type ShowcaseHouse,
} from '@/presentation/features/auth/utils/showcase';

export interface BeforeAfterShowcaseProps {
  houses?: readonly ShowcaseHouse[];
}

const CHIP = 'absolute bottom-3 rounded-md bg-ink/80 px-2.5 py-1 text-xs font-medium text-white';
const pct = (fraction: number) => `${fraction * 100}%`;

/**
 * A real house as it is, then its new finishes sweeping across it, then an arrow from each of the
 * costliest finishes to the part it is on, with what it costs. Then the next house.
 * With reduced motion the finished photo and its arrows are shown still; the dots change the house.
 */
export function BeforeAfterShowcase({ houses = SHOWCASE_HOUSES }: BeforeAfterShowcaseProps) {
  const [index, setIndex] = useState(0);
  const house = houses[index];
  const next = (index + 1) % houses.length;
  const slots = labelSlots(house.callouts.length);

  // Fetch the next pair while this one plays, so the change is instant.
  useEffect(() => {
    const following = houses[next];
    for (const stage of ['before', 'after'] as const) {
      new Image().src = showcaseImage(following.key, stage);
    }
  }, [houses, next]);

  return (
    <figure className="space-y-4">
      <div
        key={house.key}
        style={{ aspectRatio: house.aspect }}
        className="relative animate-fade-in overflow-hidden rounded-[3px] bg-mat-deep shadow-[0_2px_10px_rgb(0_0_0/0.35)]"
      >
        <img
          src={showcaseImage(house.key, 'before')}
          alt={`${house.house} as it is today`}
          className="absolute inset-0 h-full w-full"
        />
        <span className={cn(CHIP, 'right-3')}>Before</span>
        <div
          data-testid="showcase-after"
          className="absolute inset-0 animate-reveal motion-reduce:animate-none"
          onAnimationEnd={() => setIndex(next)}
        >
          <img
            src={showcaseImage(house.key, 'after')}
            alt={`${house.house} with the ${house.design} design`}
            className="absolute inset-0 h-full w-full"
          />
          <span className={cn(CHIP, 'left-3')}>After</span>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 animate-divider bg-white shadow-[0_0_6px_rgb(0_0_0/0.4)] motion-reduce:hidden"
        />

        {/* The arrows: drawn once the new finishes are on, from each label to its part. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {house.callouts.map((callout, calloutIndex) => (
            <line
              key={callout.finish}
              x1={(slots[calloutIndex] + LABEL_WIDTH / 2) * 100}
              y1={LABEL_BOTTOM * 100}
              x2={callout.x * 100}
              y2={callout.y * 100}
              pathLength={1}
              vectorEffect="non-scaling-stroke"
              className="animate-draw stroke-white [stroke-dasharray:1] [stroke-width:1.5px] motion-reduce:animate-none"
              style={{ filter: 'drop-shadow(0 0 2px rgb(0 0 0 / 0.6))' }}
            />
          ))}
        </svg>
        <ul aria-label="What changes and what it costs" className="contents">
          {house.callouts.map((callout, calloutIndex) => (
            <li key={callout.finish} className="contents">
              <span
                aria-hidden="true"
                className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 animate-callouts rounded-full border-2 border-white bg-brand-700 shadow motion-reduce:animate-none"
                style={{ left: pct(callout.x), top: pct(callout.y) }}
              />
              <div
                className="absolute animate-callouts rounded-md bg-white/95 px-2.5 py-1.5 shadow-[0_1px_6px_rgb(0_0_0/0.25)] motion-reduce:animate-none"
                // Pinned by its bottom edge, where its arrow starts, whatever its height.
                style={{
                  left: pct(slots[calloutIndex]),
                  width: pct(LABEL_WIDTH),
                  bottom: pct(1 - LABEL_BOTTOM),
                }}
              >
                <p className="truncate text-[11px] font-medium text-stone-500">{callout.parts}</p>
                <p className="truncate text-[13px] font-medium leading-tight text-stone-900">
                  {callout.finish}
                </p>
                <p className="font-mono text-[11px] tabular-nums text-stone-600">
                  {formatInr(callout.cost)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <figcaption className="flex items-start justify-between gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-[15px] font-medium text-mat-ink">
            {house.house} · {house.design}
          </p>
          <p className="text-sm leading-relaxed text-mat-line/80">
            Estimated {formatInr(house.total)} for the whole design, materials and labour
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5 pt-1.5" role="group" aria-label="Choose a house">
          {houses.map((item, itemIndex) => (
            <button
              key={item.key}
              type="button"
              aria-label={`Show the ${item.house}`}
              aria-pressed={itemIndex === index}
              onClick={() => setIndex(itemIndex)}
              className={cn(
                'h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mat-ink',
                itemIndex === index ? 'w-6 bg-mat-ink' : 'w-2 bg-mat-line/40 hover:bg-mat-line/70'
              )}
            />
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
