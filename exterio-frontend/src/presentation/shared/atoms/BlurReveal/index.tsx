import { cn } from '@/presentation/shared/utils/cn';

export interface BlurRevealProps {
  text: string;
  as?: 'h1' | 'h2' | 'p' | 'span';
  className?: string;
  /** When the first word starts, in milliseconds. */
  delayMs?: number;
  /** Time between one word starting and the next. */
  stepMs?: number;
}

/**
 * Text that reveals word by word: each word comes into focus from a soft blur, rising slightly,
 * a moment after the one before. The words are hidden from screen readers and the whole line is
 * its accessible name, so it is read as one sentence. Reduced motion shows it at once (the
 * global reduced-motion rule shortens every animation).
 */
export function BlurReveal({
  text,
  as: Tag = 'span',
  className,
  delayMs = 0,
  stepMs = 60,
}: BlurRevealProps) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, index) => (
        <span key={`${index}-${word}`} aria-hidden>
          <span
            className={cn('inline-block animate-blur-in')}
            style={{ animationDelay: `${delayMs + index * stepMs}ms` }}
          >
            {word}
          </span>
          {index < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}
