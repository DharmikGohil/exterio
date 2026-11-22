import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Input } from '@/presentation/shared/atoms/Input';
import { useAdvisorChat } from '@/presentation/features/advisor/hooks/useAdvisorChat';
import { useScrollToLatest } from '@/presentation/features/advisor/hooks/useScrollToLatest';
import { AdvisorMessageBubble } from '@/presentation/features/advisor/molecules/AdvisorMessageBubble';
import { questionAboutSource } from '@/presentation/features/advisor/utils/sourceQuestion';

const STARTER_QUESTIONS = [
  'Which finish lasts longest through heavy monsoon?',
  'What is the cheapest way to refresh my front wall?',
  'Is stone cladding worth it over texture paint?',
];

export interface AdvisorPanelProps {
  projectId: string;
  /** The design the user is looking at, sent along for context. */
  designId: string | undefined;
  designName: string | undefined;
  /** The panel stays mounted while closed; the question field is focused each time it opens. */
  isOpen: boolean;
  onClose: () => void;
}

/** Side chat with the material advisor. */
export function AdvisorPanel({
  projectId,
  designId,
  designName,
  isOpen,
  onClose,
}: AdvisorPanelProps) {
  const chat = useAdvisorChat(projectId, designId);
  const [draft, setDraft] = useState('');
  const latest = chat.entries[chat.entries.length - 1];
  const endRef = useScrollToLatest<HTMLDivElement>(
    `${chat.entries.length}-${latest?.steps.length ?? 0}-${latest?.status ?? ''}-${chat.errorMessage ?? ''}`
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.trim()) {
      chat.sendMessage(draft);
      setDraft('');
    }
  };

  return (
    <aside
      aria-label="Material advisor"
      className="fixed inset-y-0 right-0 z-50 flex w-full animate-slide-in-right flex-col border-l border-stone-200 bg-white shadow-raised sm:max-w-md"
    >
      <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-stone-900">Material advisor</h2>
            <p className="truncate text-xs text-stone-500">
              {designName
                ? `Knows about “${designName}”`
                : 'Ask about finishes, durability and cost'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {chat.entries.length > 0 && (
            <Button variant="ghost" size="sm" onClick={chat.clearConversation}>
              Clear
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Close advisor" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chat.entries.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-stone-600">
              Not sure which finish suits your house, climate or budget? Ask in your own words.
            </p>
            <ul className="space-y-2">
              {STARTER_QUESTIONS.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => chat.sendMessage(question)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700 transition-colors hover:border-brand-300 hover:bg-brand-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="space-y-3" aria-live="polite">
            {chat.entries.map((entry) => (
              <AdvisorMessageBubble
                key={entry.id}
                entry={entry}
                isBusy={chat.isThinking}
                onAskAboutSource={(title) => chat.sendMessage(questionAboutSource(title))}
              />
            ))}
          </ul>
        )}

        {chat.errorMessage && (
          <Alert
            tone="error"
            className="mt-3"
            action={
              <Button variant="outline" size="sm" onClick={chat.retry}>
                Try again
              </Button>
            }
          >
            {chat.errorMessage}
          </Alert>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-stone-200 p-3">
        <Input
          aria-label="Your question"
          ref={inputRef}
          placeholder="Ask about a finish…"
          maxLength={1000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10"
          aria-label="Send"
          disabled={!draft.trim() || chat.isThinking}
        >
          <Icon name="send" />
        </Button>
      </form>
    </aside>
  );
}
