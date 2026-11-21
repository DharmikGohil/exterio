import { Icon } from '@/presentation/shared/atoms/Icon';
import { cn } from '@/presentation/shared/utils/cn';
import type { AdvisorChatEntry } from '@/presentation/features/advisor/hooks/useAdvisorChat';

export interface AdvisorMessageBubbleProps {
  entry: AdvisorChatEntry;
}

export function AdvisorMessageBubble({ entry }: AdvisorMessageBubbleProps) {
  const isUser = entry.role === 'user';
  return (
    <li className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-900'
        )}
      >
        <span className="sr-only">{isUser ? 'You: ' : 'Advisor: '}</span>
        {entry.content}
      </div>
      {entry.sources.length > 0 && (
        <ul className="flex max-w-[85%] flex-wrap gap-1.5" aria-label="Sources">
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
