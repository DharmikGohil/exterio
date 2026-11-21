import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { Spinner } from '@/presentation/shared/atoms/Spinner';
import { Tabs, type TabItem } from '@/presentation/shared/atoms/Tabs';
import { ErrorState } from '@/presentation/shared/molecules/ErrorState';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';
import { useActiveDesign } from '@/presentation/features/design/hooks/useActiveDesign';
import { useDesignAssignments } from '@/presentation/features/design/hooks/useDesignAssignments';
import { useDesignRender } from '@/presentation/features/design/hooks/useDesignRender';
import {
  useDesignView,
  type DesignImageSource,
  type DesignViewMode,
} from '@/presentation/features/design/hooks/useDesignView';
import { useEnsureDefaultDesign } from '@/presentation/features/design/hooks/useEnsureDefaultDesign';
import { DesignCostSummary } from '@/presentation/features/design/molecules/DesignCostSummary';
import { RenderControls } from '@/presentation/features/design/molecules/RenderControls';
import { photorealOptions } from '@/presentation/features/design/utils/photoreal';
import { CompareSlider } from '@/presentation/features/design/organisms/CompareSlider';
import { DesignCanvas } from '@/presentation/features/design/organisms/DesignCanvas';
import { DesignTabs } from '@/presentation/features/design/organisms/DesignTabs';
import { MaterialPanel } from '@/presentation/features/design/organisms/MaterialPanel';
import { useEstimate } from '@/presentation/features/estimate/hooks/useEstimate';
import { useMaterials } from '@/presentation/features/materials/hooks/useMaterials';
import { NameTagToggle } from '@/presentation/shared/molecules/NameTagToggle';
import { useStoredToggle } from '@/presentation/shared/hooks/useStoredToggle';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import { useCapabilities } from '@/presentation/features/system/hooks/useCapabilities';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Design } from '@/domain/models/design';
import type { Project, ProjectImage } from '@/domain/models/project';

const VIEW_TABS: TabItem<DesignViewMode>[] = [
  { value: 'design', label: 'Design', icon: 'palette' },
  { value: 'compare', label: 'Before / after', icon: 'compare' },
];

const TITLE = 'Design your exterior';
const DESCRIPTION =
  'Pick a part of the house, then a finish. The picture and the cost update as you go. Make a few designs to compare.';

export interface DesignStepProps {
  project: Project;
  image: ProjectImage;
  onStepChange: (step: StudioStep) => void;
}

/** Step 4. Makes sure a design exists, then hands over to the workspace. */
export function DesignStep({ project, image, onStepChange }: DesignStepProps) {
  const { activeDesign, selectDesign } = useActiveDesign(project);
  const { defaultDesignError, retryCreateDefault } = useEnsureDefaultDesign(project);

  if (!activeDesign) {
    return (
      <div className="space-y-4">
        <StepHeader title={TITLE} description={DESCRIPTION} />
        {defaultDesignError ? (
          <ErrorState
            title="We could not create your first design"
            error={defaultDesignError}
            onRetry={retryCreateDefault}
          />
        ) : (
          <Skeleton className="h-[50vh] w-full rounded-xl" />
        )}
      </div>
    );
  }

  return (
    <DesignWorkspace
      // Selection and view settings belong to one design; start fresh when switching.
      key={activeDesign.id}
      project={project}
      image={image}
      design={activeDesign}
      onSelectDesign={selectDesign}
      onStepChange={onStepChange}
    />
  );
}

interface DesignWorkspaceProps extends DesignStepProps {
  design: Design;
  onSelectDesign: (designId: string) => void;
}

function DesignWorkspace({
  project,
  image,
  design,
  onSelectDesign,
  onStepChange,
}: DesignWorkspaceProps) {
  const view = useDesignView();
  const nameTags = useStoredToggle('exterio.showRegionNames', true);
  const { capabilities } = useCapabilities();
  const {
    materials,
    isLoading: isLoadingMaterials,
    error: materialsError,
    refetch,
  } = useMaterials();
  const { assignMaterial, clearMaterial, isUpdating } = useDesignAssignments(design);
  const { requestRender, isRequestingRender, isRendering } = useDesignRender(design);
  const estimate = useEstimate(design.id);

  const originalUrl = resolveFileUrl(image.url);
  const previewUrl = resolveFileUrl(design.previewUrl) ?? originalUrl;
  const renderUrl = resolveFileUrl(design.renderUrl);
  const photoreal = photorealOptions(capabilities.photorealRender, renderUrl !== null);
  const showsRender =
    photoreal.showsSourceSwitch && view.imageSource === 'render' && renderUrl !== null;
  const displayedUrl = showsRender ? renderUrl : previewUrl;
  const selectedRegion =
    project.regions.find((region) => region.id === view.selectedRegionId) ?? null;

  const sourceTabs: TabItem<DesignImageSource>[] = [
    { value: 'preview', label: 'Instant preview' },
    {
      value: 'render',
      label: 'Photoreal render',
      disabled: renderUrl === null,
      disabledReason: 'Generate a photoreal render first',
    },
  ];

  const handleGenerateRender = () => {
    view.setImageSource('render');
    requestRender();
  };

  return (
    <div className="space-y-4">
      <StepHeader
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <DesignCostSummary
            totals={estimate.estimate?.totals}
            isLoading={estimate.isLoading}
            isRefreshing={estimate.isFetching || isUpdating}
            hasError={Boolean(estimate.error)}
          />
        }
      />

      {/* One row: the design options on the left, how the picture is shown on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <DesignTabs project={project} activeDesign={design} onSelect={onSelectDesign} />
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            items={VIEW_TABS}
            value={view.viewMode}
            onValueChange={view.setViewMode}
            variant="pill"
            label="Canvas view"
          />
          {view.viewMode !== 'compare' && (
            <NameTagToggle isOn={nameTags.isOn} onToggle={nameTags.toggle} />
          )}
          {photoreal.showsSourceSwitch && (
            <Tabs
              items={sourceTabs}
              value={showsRender ? 'render' : 'preview'}
              onValueChange={view.setImageSource}
              variant="pill"
              label="Picture type"
            />
          )}
        </div>
      </div>

      {project.regions.length === 0 && (
        <Alert
          tone="warning"
          title="No parts are marked yet"
          action={
            <Button size="sm" variant="outline" onClick={() => onStepChange('regions')}>
              Go to Regions
            </Button>
          }
        >
          Finishes are applied to the regions you mark on the photo. Mark at least one wall first.
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-3">
          <div className="relative">
            {view.viewMode === 'compare' ? (
              <CompareSlider image={image} beforeUrl={originalUrl} afterUrl={displayedUrl} />
            ) : (
              <DesignCanvas
                image={image}
                imageUrl={displayedUrl}
                regions={project.regions}
                selectedRegionId={view.selectedRegionId}
                hoveredRegionId={view.hoveredRegionId}
                onSelectRegion={view.selectRegion}
                onHoverRegion={view.setHoveredRegionId}
                showNames={nameTags.isOn}
              />
            )}
            {(isUpdating || isRendering) && (
              <div className="pointer-events-none absolute right-3 top-3 flex h-7 items-center gap-2 rounded-md bg-ink px-2.5 text-xs text-white">
                <Spinner size="sm" label={isUpdating ? 'Updating preview' : 'Rendering'} />
                {isUpdating ? 'Updating preview…' : 'Rendering…'}
              </div>
            )}
          </div>

          {showsRender && (
            <p className="text-xs leading-relaxed text-stone-500">
              The photoreal render shows the design as it was when you generated it. Regenerate it
              after changing finishes.
            </p>
          )}

          {photoreal.showsGenerate && (
            <RenderControls
              status={design.renderStatus}
              error={design.renderError}
              isRequesting={isRequestingRender}
              onGenerate={handleGenerateRender}
            />
          )}
        </div>

        <MaterialPanel
          regions={project.regions}
          selectedRegion={selectedRegion}
          assignments={design.assignments}
          materials={materials}
          isLoadingMaterials={isLoadingMaterials}
          materialsError={materialsError}
          onRetryMaterials={refetch}
          isUpdating={isUpdating}
          onSelectRegion={view.selectRegion}
          onHoverRegion={view.setHoveredRegionId}
          onAssign={assignMaterial}
          onClear={clearMaterial}
        />
      </div>

      <StepFooter step="design" onStepChange={onStepChange} />
    </div>
  );
}
