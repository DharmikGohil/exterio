import type { ReactNode } from 'react';

export interface StepHeaderProps {
  title: string;
  description: string;
  /** Buttons and status shown on the right (wraps below on small screens). */
  actions?: ReactNode;
}

export function StepHeader({ title, description, actions }: StepHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 space-y-1">
        <h2 className="text-[26px] font-medium leading-tight tracking-[-0.01em] text-stone-900">
          {title}
        </h2>
        <p className="max-w-4xl text-sm leading-relaxed text-stone-600">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
