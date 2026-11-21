import { cn } from '@/presentation/shared/utils/cn';

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface ScoreRingProps {
  /** 0-100 */
  score: number;
  className?: string;
}

function getToneClass(score: number): string {
  if (score >= 75) return 'stroke-emerald-600';
  if (score >= 50) return 'stroke-amber-500';
  return 'stroke-red-600';
}

/** A circular gauge for the photo quality score. */
export function ScoreRing({ score, className }: ScoreRingProps) {
  const clamped = Math.min(Math.max(score, 0), 100);
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Photo quality score ${Math.round(clamped)} out of 100`}
      className={cn('h-16 w-16 shrink-0', className)}
    >
      <circle cx="32" cy="32" r={RADIUS} fill="none" strokeWidth="4" className="stroke-stone-200" />
      <circle
        cx="32"
        cy="32"
        r={RADIUS}
        fill="none"
        strokeWidth="4"
        strokeLinecap="butt"
        strokeDasharray={`${(clamped / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        transform="rotate(-90 32 32)"
        className={getToneClass(clamped)}
      />
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-stone-900 font-mono text-[16px]"
      >
        {Math.round(clamped)}
      </text>
    </svg>
  );
}
