import { Button } from '@/presentation/shared/atoms/Button';
import { Select } from '@/presentation/shared/atoms/Select';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { EmptyState } from '@/presentation/shared/molecules/EmptyState';
import { ErrorState } from '@/presentation/shared/molecules/ErrorState';
import { useActiveDesign } from '@/presentation/features/design/hooks/useActiveDesign';
import { useAreaOverrides } from '@/presentation/features/estimate/hooks/useAreaOverrides';
import { useEstimate } from '@/presentation/features/estimate/hooks/useEstimate';
import { useRateOverrides } from '@/presentation/features/estimate/hooks/useRateOverrides';
import { useReportDownload } from '@/presentation/features/estimate/hooks/useReportDownload';
import { AssumptionsList } from '@/presentation/features/estimate/organisms/AssumptionsList';
import { BillOfQuantitiesTable } from '@/presentation/features/estimate/organisms/BillOfQuantitiesTable';
import { CompareDesigns } from '@/presentation/features/estimate/organisms/CompareDesigns';
import { GrandTotalCard } from '@/presentation/features/estimate/organisms/GrandTotalCard';
import { ScaleSummaryCard } from '@/presentation/features/estimate/organisms/ScaleSummaryCard';
import { SurfacesTable } from '@/presentation/features/estimate/organisms/SurfacesTable';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Design } from '@/domain/models/design';
import type { Project } from '@/domain/models/project';

const TITLE = 'Estimate & report';
const DESCRIPTION =
  'What the chosen design needs and what it is likely to cost. Adjust any figure you know better, then download the report for your contractor.';

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
  const designOptions = project.designs.map((item) => ({ value: item.id, label: item.name }));

  return (
    <div className="space-y-6">
      <StepHeader
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <>
            <Select
              aria-label="Design to estimate"
              options={designOptions}
              value={design.id}
              onChange={(event) => onSelectDesign(event.target.value)}
              wrapperClassName="w-48"
            />
            <Button
              icon="download"
              disabled={!estimate}
              isLoading={isDownloading}
              onClick={() => downloadReport(design)}
            >
              Download PDF report
            </Button>
          </>
        }
      />

      {isLoading && (
        <div className="space-y-5" aria-busy="true">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {!isLoading && error && !estimate && (
        <ErrorState title="We could not calculate the estimate" error={error} onRetry={refetch} />
      )}

      {estimate && (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <GrandTotalCard
              totals={estimate.totals}
              categories={estimate.categories}
              confidencePct={estimate.scale.confidencePct}
              isRefreshing={isFetching}
            />
            <ScaleSummaryCard
              scale={estimate.scale}
              isScaleSaved={project.scale !== null}
              onAdjustScale={() => onStepChange('scale')}
            />
          </div>

          <SurfacesTable
            rows={estimate.regions}
            surfaces={estimate.surfaces}
            regions={project.regions}
            syncToken={dataUpdatedAt}
            isSaving={areas.isSavingOverrides}
            onAreaChange={areas.setAreaOverride}
            onLengthChange={areas.setLengthOverride}
            onReset={areas.resetOverrides}
          />

          <BillOfQuantitiesTable
            lines={estimate.lines}
            overrides={rates.overrides}
            syncToken={dataUpdatedAt}
            isSaving={rates.isSavingRates}
            onRateChange={rates.setRate}
            onReset={rates.resetRates}
          />

          <AssumptionsList assumptions={estimate.assumptions} />
        </>
      )}

      <CompareDesigns
        designs={project.designs}
        activeDesignId={design.id}
        onSelectDesign={onSelectDesign}
      />

      <StepFooter step="estimate" onStepChange={onStepChange} />
    </div>
  );
}
