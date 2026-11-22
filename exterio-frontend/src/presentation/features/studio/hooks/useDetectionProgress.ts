import { useEffect, useState } from 'react';

/**
 * What Auto-detect looks for, in the order a person would, each from the second it is shown.
 * The AI answers in one go and reports nothing on the way, so this pacing is by time: it follows
 * how long detection takes (about 30 to 40 seconds measured on the sample houses), not what the
 * model has finished.
 */
export const DETECTION_STAGES = [
  { from: 0, label: 'Sending the photo to the AI' },
  { from: 3, label: 'Looking over the whole front of the house' },
  { from: 8, label: 'Outlining the walls and the roof' },
  { from: 15, label: 'Finding windows, doors and the garage' },
  { from: 22, label: 'Checking pillars, railings, gates and fences' },
  { from: 29, label: 'Naming each part and tidying the outlines' },
] as const;

/** How long detection usually takes, in seconds. */
export const TYPICAL_DETECTION_SECONDS = 35;
/** After this long the wait is called out as longer than usual. */
export const SLOW_DETECTION_SECONDS = 55;
const TICK_MS = 250;
/** The bar never reaches the end on its own; the result does that. */
const MAX_PROGRESS = 0.95;

export function detectionStageAt(seconds: number): number {
  let index = 0;
  DETECTION_STAGES.forEach((stage, position) => {
    if (seconds >= stage.from) {
      index = position;
    }
  });
  return index;
}

/** Fills quickly at first and slows as it nears the typical time, like a download estimate. */
export function detectionProgressAt(seconds: number): number {
  return MAX_PROGRESS * (1 - Math.exp(-seconds / (TYPICAL_DETECTION_SECONDS / 2)));
}

/** Seconds since Auto-detect started, the stage being shown and how full the bar is. */
export function useDetectionProgress(isActive: boolean) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Restarting the clock when a detection starts is a reset on a changed input.
  if (isActive && startedAt === null) {
    setStartedAt(Date.now());
  } else if (!isActive && startedAt !== null) {
    setStartedAt(null);
  }

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [isActive]);

  const seconds = startedAt === null ? 0 : Math.max(0, (now - startedAt) / 1000);
  return {
    seconds: Math.floor(seconds),
    stageIndex: detectionStageAt(seconds),
    progress: detectionProgressAt(seconds),
    isSlow: seconds >= SLOW_DETECTION_SECONDS,
  };
}
