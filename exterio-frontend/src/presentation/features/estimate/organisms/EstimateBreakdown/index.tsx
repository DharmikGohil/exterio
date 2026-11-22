import { useState } from 'react';

import { Icon } from '@/presentation/shared/atoms/Icon';
import { Tabs, type TabItem } from '@/presentation/shared/atoms/Tabs';
import { formatInr } from '@/presentation/shared/utils/format';
import type { useAreaOverrides } from '@/presentation/features/estimate/hooks/useAreaOverrides';
import type { useRateOverrides } from '@/presentation/features/estimate/hooks/useRateOverrides';
import { SavingIndicator } from '@/presentation/features/estimate/molecules/SavingIndicator';
import { CompareDesigns } from '@/presentation/features/estimate/organisms/CompareDesigns';
import { GoodToKnow } from '@/presentation/features/estimate/organisms/GoodToKnow';
import { SurfacesTable } from '@/presentation/features/estimate/organisms/SurfacesTable';
import { WhatToBuyTable } from '@/presentation/features/estimate/organisms/WhatToBuyTable';
import { describeLeftOut, goodToKnow } from '@/presentation/features/estimate/utils/estimateCopy';
import type { PartGroup } from '@/presentation/features/estimate/utils/partGroups';
import type { Design } from '@/domain/models/design';
import type { Estimate } from '@/domain/models/estimate';
import type { Project } from '@/domain/models/project';
import { CategoryTotals } from '@/presentation/features/estimate/molecules/CategoryTotals';

type BreakdownTab = 'buy' | 'sizes' | 'compare';

const TABS: TabItem<BreakdownTab>[] = [
  { value: 'buy', label: 'What to buy' },
  { value: 'sizes', label: 'Part sizes' },
  { value: 'compare', label: 'Compare designs' },
];

export interface EstimateBreakdownProps {
  project: Project;
  design: Design;
  estimate: Estimate;
  groups: readonly PartGroup[];
  syncToken: number;
  rates: ReturnType<typeof useRateOverrides>;
  areas: ReturnType<typeof useAreaOverrides>;
  onBack: () => void;
  onSelectDesign: (designId: string) => void;
}

/**
 * The estimate in full: what to buy and what it costs (with editable rates), the size of every
 * part (with editable areas), and the designs side by side, beside what to know before trusting
 * the numbers.
 */
export function EstimateBreakdown({
  project,
  design,
  estimate,
  groups,
  syncToken,
  rates,
  areas,
  onBack,
  onSelectDesign,
}: EstimateBreakdownProps) {
  const [tab, setTab] = useState<BreakdownTab>('buy');
  const hasRoof = estimate.regions.some((row) => row.label === 'roof' && !row.isOverride);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 rounded-md text-[15px] text-stone-700 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Icon name="arrow-left" />
        Back to your estimate
      </button>

      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-[34px] font-medium leading-tight tracking-[-0.015em] text-stone-900">
            Full breakdown
          </h1>
          <p className="max-w-4xl text-[15px] leading-relaxed text-stone-600">
            What to buy, how much of it, and where every rupee goes. Change any rate you have a
            quote for and the total updates.
          </p>
        </div>
        <dl className="flex flex-wrap gap-3">
          {[
            ['Total', estimate.totals.grandTotal],
            ['Materials', estimate.totals.materialCost],
            ['Labour', estimate.totals.labourCost],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-white px-5 py-3">
              <dt className="text-sm text-stone-600">{label}</dt>
              <dd className="text-xl font-medium tabular-nums text-stone-900">
                {formatInr(Number(value))}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <CategoryTotals categories={estimate.categories} grandTotal={estimate.totals.grandTotal} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <Tabs
              items={TABS}
              value={tab}
              onValueChange={setTab}
              variant="pill"
              label="Breakdown sections"
              className="p-1"
            />
            <SavingIndicator isSaving={rates.isSavingRates || areas.isSavingOverrides} />
          </div>

          {tab === 'buy' && (
            <WhatToBuyTable
              lines={estimate.lines}
              regions={estimate.regions}
              totals={estimate.totals}
              overrides={rates.overrides}
              syncToken={syncToken}
              onRateChange={rates.setRate}
              onReset={rates.resetRates}
            />
          )}
          {tab === 'sizes' && (
            <div className="px-5 pb-5">
              <SurfacesTable
                rows={estimate.regions}
                surfaces={estimate.surfaces}
                regions={project.regions}
                syncToken={syncToken}
                isSaving={areas.isSavingOverrides}
                onAreaChange={areas.setAreaOverride}
                onLengthChange={areas.setLengthOverride}
                onReset={areas.resetOverrides}
              />
            </div>
          )}
          {tab === 'compare' && (
            <div className="px-5 pb-5">
              <CompareDesigns
                designs={project.designs}
                activeDesignId={design.id}
                onSelectDesign={onSelectDesign}
              />
            </div>
          )}
        </section>

        <GoodToKnow
          notes={goodToKnow(project.scale, estimate.scale.confidencePct, hasRoof)}
          leftOut={describeLeftOut(groups)}
        />
      </div>
    </div>
  );
}
