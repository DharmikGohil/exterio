import type { ReactNode } from 'react';

import { Tabs, type TabItem } from '@/presentation/shared/atoms/Tabs';
import { SCALE_METHOD_META } from '@/presentation/features/studio/utils/scaleDefaults';
import { SCALE_METHODS, type ScaleMethod } from '@/domain/models/project';

const METHOD_TABS: TabItem<ScaleMethod>[] = SCALE_METHODS.map((method) => ({
  value: method,
  label: SCALE_METHOD_META[method].shortTitle,
}));

export interface ScaleMethodPickerProps {
  value: ScaleMethod;
  onChange: (method: ScaleMethod) => void;
  /** The inputs for the chosen method. */
  details: ReactNode;
}

/**
 * Four plain-language ways to tell the app how big the house is, as one segmented control.
 * Under it, how accurate the chosen way is, what to do, and its inputs.
 */
export function ScaleMethodPicker({ value, onChange, details }: ScaleMethodPickerProps) {
  const meta = SCALE_METHOD_META[value];
  return (
    <div className="space-y-4">
      <Tabs
        items={METHOD_TABS}
        value={value}
        onValueChange={onChange}
        variant="pill"
        label="How do you know the size?"
        fullWidth
        className="p-1"
      />
      <p className="text-[15px] leading-relaxed text-stone-600">
        <span className="font-medium text-stone-900">{meta.accuracy}.</span> {meta.description}
      </p>
      {details}
    </div>
  );
}
