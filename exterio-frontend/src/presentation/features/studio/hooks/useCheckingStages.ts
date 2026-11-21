import { useEffect, useState } from 'react';

export const PHOTO_CHECK_STAGES = [
  'Uploading your photo',
  'Checking sharpness and lighting',
  'Making sure it shows a house front',
  'Preparing your results',
] as const;

const STAGE_INTERVAL_MS = 2200;

/**
 * Walks through the check stages while a photo is being processed.
 *
 * The server does not report progress, so the stages advance on a timer and stop on the
 * last one until the response arrives. They describe what the server really does, in order.
 */
export function useCheckingStages(isActive: boolean) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setActiveIndex(0);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((index) => Math.min(index + 1, PHOTO_CHECK_STAGES.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isActive]);

  return { stages: PHOTO_CHECK_STAGES, activeIndex };
}
