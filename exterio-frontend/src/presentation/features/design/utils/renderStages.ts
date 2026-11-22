/**
 * What the photoreal render is doing, from the second each stage is shown. The renderer answers
 * in one go, so this is paced by time, following how long a render usually takes (about 10 to
 * 15 s on Gemini). After 30 s the backup renderer may be starting its GPU, and the note says so.
 */
export const RENDER_STAGES = [
  { from: 0, label: 'Sending your design to the AI' },
  { from: 3, label: 'Adding real texture to each finish' },
  { from: 7, label: 'Matching the light and shadows' },
  { from: 11, label: 'Blending it into your photo' },
] as const;

export const SLOW_RENDER_SECONDS = 30;

export function renderStageAt(seconds: number): string {
  if (seconds >= SLOW_RENDER_SECONDS) {
    return 'Still working: the backup renderer may be warming up';
  }
  let label: string = RENDER_STAGES[0].label;
  for (const stage of RENDER_STAGES) {
    if (seconds >= stage.from) {
      label = stage.label;
    }
  }
  return label;
}
