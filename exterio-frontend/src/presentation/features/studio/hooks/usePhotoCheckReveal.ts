import { useEffect, useState } from 'react';

import {
  hasSeenPhotoCheck,
  markPhotoCheckSeen,
} from '@/presentation/features/studio/utils/photoCheckSeen';
import { prefersReducedMotion } from '@/presentation/shared/utils/motion';

export const PHOTO_REVEAL_STAGES = [
  'Loading your photo',
  'Checking sharpness and lighting',
  'Making sure it shows a house front',
  'Preparing your results',
] as const;

export const REVEAL_STAGE_MS = 650;

/**
 * The first time this browser opens a house's photo (a sample, or a house uploaded elsewhere),
 * its saved photo check is walked through stage by stage, as it is right after an upload, and
 * then shown. After that, and with reduced motion, the result shows straight away.
 */
export function usePhotoCheckReveal(projectId: string, hasPhoto: boolean) {
  const [isRevealing, setIsRevealing] = useState(
    () => hasPhoto && !hasSeenPhotoCheck(projectId) && !prefersReducedMotion()
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isRevealing) {
      if (hasPhoto) {
        markPhotoCheckSeen(projectId);
      }
      return undefined;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((index) => {
        if (index >= PHOTO_REVEAL_STAGES.length - 1) {
          setIsRevealing(false);
          return index;
        }
        return index + 1;
      });
    }, REVEAL_STAGE_MS);
    return () => window.clearInterval(timer);
  }, [isRevealing, hasPhoto, projectId]);

  return { isRevealing, stages: PHOTO_REVEAL_STAGES, activeIndex };
}
