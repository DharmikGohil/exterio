import { useMemo } from 'react';

import { Button } from '@/presentation/shared/atoms/Button';
import { Icon } from '@/presentation/shared/atoms/Icon';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { DropdownMenu } from '@/presentation/shared/molecules/DropdownMenu';
import { EmptyState } from '@/presentation/shared/molecules/EmptyState';
import { ErrorState } from '@/presentation/shared/molecules/ErrorState';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';
import { useActiveDesign } from '@/presentation/features/design/hooks/useActiveDesign';
import { useAreaOverrides } from '@/presentation/features/estimate/hooks/useAreaOverrides';
import { useEstimate } from '@/presentation/features/estimate/hooks/useEstimate';
import { useEstimateView } from '@/presentation/features/estimate/hooks/useEstimateView';
import { useRateOverrides } from '@/presentation/features/estimate/hooks/useRateOverrides';
import { useReportDownload } from '@/presentation/features/estimate/hooks/useReportDownload';
import { EstimateBreakdown } from '@/presentation/features/estimate/organisms/EstimateBreakdown';
import { EstimateDiagram } from '@/presentation/features/estimate/organisms/EstimateDiagram';
import { EstimateSummary } from '@/presentation/features/estimate/organisms/EstimateSummary';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import {
  describeExclusions,
  describeScaleBasis,
} from '@/presentation/features/estimate/utils/estimateCopy';
import { buildPartGroups } from '@/presentation/features/estimate/utils/partGroups';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Design } from '@/domain/models/design';
import type { Project } from '@/domain/models/project';

const TITLE = 'Your estimate';
const DESCRIPTION = 'Every part of your house, what goes on it, and what it costs.';

export interface EstimateStepProps {
  project: Project;
  onStepChange: (step: StudioStep) => void;
}

/** Step 5. Needs a design to price; otherwise points the user back to the Design step. */
export function EstimateStep({ project, onStepChange }: EstimateStepProps) {
  const { activeDesign, selectDesign } = useActiveDesign(project);

  if (!activeDesign) {
    return (
      <div className="space-y-5">
        <StepHeader title={TITLE} description={DESCRIPTION} />
        <EmptyState
          icon="palette"
          title="No design to estimate yet"
          description="Create a design and apply some finishes first. The estimate is calculated from them."
          action={<Button onClick={() => onStepChange('design')}>Go to Design</Button>}
        />
      </div>
    );
  }

  return (
    <EstimateWorkspace
      project={project}
      design={activeDesign}
      onSelectDesign={selectDesign}
      onStepChange={onStepChange}
    />
  );
}

interface EstimateWorkspaceProps extends EstimateStepProps {
  design: Design;
  onSelectDesign: (designId: string) => void;
}

function EstimateWorkspace({
  project,
  design,
  onSelectDesign,
  onStepChange,
}: EstimateWorkspaceProps) {
  const { estimate, isLoading, isFetching, error, refetch, dataUpdatedAt } = useEstimate(design.id);
  const areas = useAreaOverrides(project);
  const rates = useRateOverrides(project);
  const { downloadReport, isDownloading } = useReportDownload(project.name);
  const { view, openBreakdown, openOverview } = useEstimateView();

  const image = project.image;
  const groups = useMemo(
    () => (estimate && image ? buildPartGroups(estimate.regions, project.regions, image) : []),
    [estimate, image, project.regions]
  );
  const imageUrl = resolveFileUrl(design.previewUrl) ?? resolveFileUrl(image?.url ?? null) ?? '';
  const downloadButton = (
    <Button
      icon="download"
      disabled={!estimate}
      isLoading={isDownloading}
      onClick={() => downloadReport(design)}
    >
      Download PDF report
    </Button>
  );

  if (view === 'breakdown' && estimate) {
    return (
      <div className="space-y-6">
        <EstimateBreakdown
          project={project}
          design={design}
          estimate={estimate}
          groups={groups}
          syncToken={dataUpdatedAt}
          rates={rates}
          areas={areas}
          onBack={openOverview}
          onSelectDesign={onSelectDesign}
        />
        <StepFooter
          step="estimate"
          onStepChange={onStepChange}
          meta="Rates are typical market rates. Change any rate you have a quote for."
          primaryAction={downloadButton}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepHeader
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <DropdownMenu
            label="Design to estimate"
            align="end"
            triggerClassName="flex h-12 max-w-[min(24rem,80vw)] items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 text-[15px] font-medium text-stone-900 transition-colors hover:border-stone-400"
            trigger={
              <>
                <span className="shrink-0 font-normal text-stone-500">Design:</span>
                <span className="truncate">{design.name}</span>
                <Icon name="chevron-down" className="h-4 w-4 shrink-0" />
              </>
            }
            items={project.designs.map((item) => ({
              key: item.id,
              label: item.name,
              checked: item.id === design.id,
              onSelect: () => onSelectDesign(item.id),
            }))}
          />
        }
      />

      {isLoading && (
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="h-36 rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-[20rem_1fr_20rem]">
            <Skeleton className="h-[28rem] rounded-2xl" />
            <Skeleton className="h-[28rem] rounded-2xl" />
            <Skeleton className="h-[28rem] rounded-2xl" />
          </div>
        </div>
      )}

      {!isLoading && error && !estimate && (
        <ErrorState title="We could not calculate the estimate" error={error} onRetry={refetch} />
      )}

      {estimate && (
        <>
          <EstimateSummary
            totals={estimate.totals}
            confidencePct={estimate.scale.confidencePct}
            scaleBasis={describeScaleBasis(project.scale)}
            isRefreshing={isFetching}
            isRoughSize={project.scale === null}
            onAdjustScale={() => onStepChange('scale')}
            onOpenBreakdown={openBreakdown}
          />

          {image && (
            <EstimateDiagram
              groups={groups}
              imageUrl={imageUrl}
              imageAlt={`Front of ${project.name} with the ${design.name} finishes`}
              caption={`Front of the house · ${design.name}`}
            />
          )}

          <p className="max-w-3xl text-[15px] leading-relaxed text-stone-600">
            {describeExclusions(groups)}
          </p>
        </>
      )}

      <StepFooter
        step="estimate"
        onStepChange={onStepChange}
        meta="Step 5 of 5 · Estimates are advisory, not a binding quotation"
        primaryAction={downloadButton}
      />
    </div>
  );
}
