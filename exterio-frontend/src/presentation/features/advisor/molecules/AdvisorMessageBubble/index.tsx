import { AdvisorSteps } from '@/presentation/features/advisor/molecules/AdvisorSteps';
import type { AdvisorChatEntry } from '@/presentation/features/advisor/hooks/useAdvisorChat';
import { useTypewriter } from '@/presentation/features/advisor/hooks/useTypewriter';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { cn } from '@/presentation/shared/utils/cn';

export interface AdvisorMessageBubbleProps {
  entry: AdvisorChatEntry;
}

export function AdvisorMessageBubble({ entry }: AdvisorMessageBubbleProps) {
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
        <ul className="flex max-w-[85%] animate-fade-in flex-wrap gap-1.5" aria-label="Sources">
          {entry.sources.map((source) => (
            <li
              key={source.title}
              className="flex h-6 items-center gap-1 rounded-md border border-stone-200 bg-white px-2 text-xs text-stone-600"
            >
              <Icon name="report" className="h-3 w-3 text-stone-400" />
              {source.title}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
