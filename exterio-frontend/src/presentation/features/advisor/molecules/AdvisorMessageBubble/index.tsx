import { AdvisorSteps } from '@/presentation/features/advisor/molecules/AdvisorSteps';
import type { AdvisorChatEntry } from '@/presentation/features/advisor/hooks/useAdvisorChat';
import { useTypewriter } from '@/presentation/features/advisor/hooks/useTypewriter';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { cn } from '@/presentation/shared/utils/cn';

export interface AdvisorMessageBubbleProps {
  entry: AdvisorChatEntry;
  /** Asks the advisor about one of the notes an answer was based on. */
  onAskAboutSource?: (title: string) => void;
  /** While another answer is on its way, the sources cannot start a new question. */
  isBusy?: boolean;
}

export function AdvisorMessageBubble({
  entry,
  onAskAboutSource,
  isBusy = false,
}: AdvisorMessageBubbleProps) {
  const isUser = entry.role === 'user';
  const typed = useTypewriter(entry.content, !isUser);
  const isWorking = entry.status === 'streaming' || typed.isTyping;
  const isWriting = entry.steps.some((step) => step.key === 'answer');

  return (
    <li className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
      {!isUser && <AdvisorSteps steps={entry.steps} isWorking={isWorking} />}

      {typed.text ? (
        <div
          className={cn(
            'max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm leading-relaxed',
            isUser ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-900'
          )}
        >
          <span className="sr-only">{isUser ? 'You: ' : 'Advisor: '}</span>
          {typed.text}
          {isWorking && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-stone-400"
            />
          )}
        </div>
      ) : (
        isWriting &&
        isWorking && (
          <div
            aria-label="Writing the answer"
            className="w-[85%] space-y-2 rounded-lg bg-stone-50 px-3 py-3"
          >
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        )
      )}

      {!isWorking && entry.sources.length > 0 && (
        <ul className="flex max-w-[85%] animate-fade-in flex-col gap-1.5" aria-label="Sources">
          {entry.sources.map((source) => (
            <li key={source.title}>
              <button
                type="button"
                disabled={!onAskAboutSource || isBusy}
                title={`Ask about “${source.title}”`}
                onClick={() => onAskAboutSource?.(source.title)}
                className="group flex w-full items-start gap-1.5 rounded-md border border-stone-200 bg-white px-2 py-1 text-left text-xs leading-snug text-stone-600 transition-colors hover:border-brand-300 hover:bg-brand-50/60 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-default disabled:hover:border-stone-200 disabled:hover:bg-white disabled:hover:text-stone-600"
              >
                <Icon name="report" className="mt-px h-3 w-3 shrink-0 text-stone-400" />
                <span className="min-w-0 flex-1">{source.title}</span>
                <Icon
                  name="arrow-right"
                  className="mt-px h-3 w-3 shrink-0 text-stone-400 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-0"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
