import type { ReactNode } from 'react';

import { Badge } from '@/presentation/shared/atoms/Badge';
import { cn } from '@/presentation/shared/utils/cn';
import { SCALE_METHOD_META } from '@/presentation/features/studio/utils/scaleDefaults';
import { SCALE_METHODS, type ScaleMethod } from '@/domain/models/project';

export interface ScaleMethodPickerProps {
  value: ScaleMethod;
  onChange: (method: ScaleMethod) => void;
  /** The inputs for the chosen method, shown inside its own card. */
  details: ReactNode;
}

/**
 * Four plain-language ways to tell the app how big the house is. The chosen option opens
 * to show its explanation and inputs right where it was picked, so nothing is missed.
 */
export function ScaleMethodPicker({ value, onChange, details }: ScaleMethodPickerProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">How do you want to set the size?</legend>
      {SCALE_METHODS.map((method) => {
        const meta = SCALE_METHOD_META[method];
        const isSelected = method === value;
        return (
          <div
            key={method}
            className={cn(
              'rounded-lg border transition-colors',
              isSelected ? 'border-stone-900 bg-white' : 'border-stone-200 hover:border-stone-300'
            )}
          >
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 has-[:focus-visible]:rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500">
              <input
                type="radio"
                name="scale-method"
                value={method}
                checked={isSelected}
                onChange={() => onChange(method)}
                className="h-4 w-4 shrink-0 accent-brand-700"
              />
              <span className="min-w-0 flex-1 text-sm font-medium text-stone-900">
                {meta.title}
              </span>
              <Badge tone={meta.accuracyTone}>{meta.accuracy}</Badge>
            </label>
            {isSelected && (
              <div className="space-y-3 border-t border-stone-200 px-3 pb-3 pt-3">
                <p className="text-sm leading-relaxed text-stone-600">{meta.description}</p>
                {details}
              </div>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
