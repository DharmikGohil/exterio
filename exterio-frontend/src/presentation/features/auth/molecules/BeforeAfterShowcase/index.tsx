import { useEffect, useState } from 'react';

import { cn } from '@/presentation/shared/utils/cn';
import {
  SHOWCASE_HOUSES,
  showcaseImage,
  type ShowcaseHouse,
} from '@/presentation/features/auth/utils/showcase';

export interface BeforeAfterShowcaseProps {
  houses?: readonly ShowcaseHouse[];
}

const CHIP = 'absolute top-3 rounded-md bg-ink/80 px-2.5 py-1 text-xs font-medium text-white';

/**
 * A real house photo with its new finishes sweeping across it and back, then the next house.
 * With reduced motion the photo is shown split down the middle and the dots change the house.
 */
export function BeforeAfterShowcase({ houses = SHOWCASE_HOUSES }: BeforeAfterShowcaseProps) {
  const [index, setIndex] = useState(0);
  const house = houses[index];
  const next = (index + 1) % houses.length;

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
        className="relative aspect-[3/2] animate-fade-in overflow-hidden rounded-[3px] bg-mat-deep shadow-[0_2px_10px_rgb(0_0_0/0.35)]"
      >
        <img
          src={showcaseImage(house.key, 'before')}
          alt={`${house.house} as it is today`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className={cn(CHIP, 'right-3')}>Before</span>
        <div
          data-testid="showcase-after"
          className="absolute inset-0 animate-reveal motion-reduce:animate-none motion-reduce:[clip-path:inset(0_50%_0_0)]"
          onAnimationEnd={() => setIndex(next)}
        >
          <img
            src={showcaseImage(house.key, 'after')}
            alt={`${house.house} with the ${house.design} design`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className={cn(CHIP, 'left-3')}>After</span>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 animate-divider bg-white shadow-[0_0_6px_rgb(0_0_0/0.4)] motion-reduce:left-1/2 motion-reduce:animate-none"
        />
      </div>

      <figcaption className="flex items-start justify-between gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-[15px] font-medium text-mat-ink">
            {house.house} · {house.design}
          </p>
          <p className="text-sm leading-relaxed text-mat-line/80">{house.finishes}</p>
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
