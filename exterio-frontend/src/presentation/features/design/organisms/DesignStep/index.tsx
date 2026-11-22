import { Alert } from '@/presentation/shared/atoms/Alert';
import { Button } from '@/presentation/shared/atoms/Button';
import { Skeleton } from '@/presentation/shared/atoms/Skeleton';
import { Spinner } from '@/presentation/shared/atoms/Spinner';
import { Tabs, type TabItem } from '@/presentation/shared/atoms/Tabs';
import { ErrorState } from '@/presentation/shared/molecules/ErrorState';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';
import { AdvisorButton } from '@/presentation/features/advisor/molecules/AdvisorButton';
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
import { RenderButton } from '@/presentation/features/design/molecules/RenderButton';
import { photorealOptions } from '@/presentation/features/design/utils/photoreal';
import { CompareSlider } from '@/presentation/features/design/organisms/CompareSlider';
import { DesignCanvas } from '@/presentation/features/design/organisms/DesignCanvas';
import { DesignSwitcher } from '@/presentation/features/design/organisms/DesignSwitcher';
import { MaterialPanel } from '@/presentation/features/design/organisms/MaterialPanel';
import { useEstimate } from '@/presentation/features/estimate/hooks/useEstimate';
import { useMaterials } from '@/presentation/features/materials/hooks/useMaterials';
import { NameTagToggle } from '@/presentation/shared/molecules/NameTagToggle';
import { useElementSize } from '@/presentation/shared/hooks/useElementSize';
import { useStoredToggle } from '@/presentation/shared/hooks/useStoredToggle';
import { StepFooter } from '@/presentation/features/studio/molecules/StepFooter';
import { StepHeader } from '@/presentation/features/studio/molecules/StepHeader';
import { useCapabilities } from '@/presentation/features/system/hooks/useCapabilities';
import { maxPhotoHeight, photoFrameStyle } from '@/presentation/shared/utils/photoFrame';
import type { StudioStep } from '@/presentation/routes/paths';
import type { Design } from '@/domain/models/design';
import type { Project, ProjectImage } from '@/domain/models/project';

/** The view switches sit in the row above the photo, the same height as the design picker. */
const ROW_TABS = 'h-11 items-center rounded-xl border border-stone-300 bg-white px-1.5';

const VIEW_TABS: TabItem<DesignViewMode>[] = [
  { value: 'design', label: 'Design', icon: 'palette' },
  { value: 'compare', label: 'Before / after', icon: 'compare' },
];

const TITLE = 'Design your exterior';
const DESCRIPTION = 'Pick a part, then a finish. Make a few designs to compare.';

export interface DesignStepProps {
  project: Project;
  image: ProjectImage;
  onStepChange: (step: StudioStep) => void;
}

/** Step 4. Makes sure a design exists, then hands over to the workspace. */
const ONE_LINE_TOOLBAR_PX = 44;

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
  // The row above the photo can wrap onto two lines on a narrower screen; the photo gives up
  // whatever height it really takes. Until it is measured, it is taken as one 44 px line.
  const toolbar = useElementSize<HTMLDivElement>();
  const toolbarHeight = toolbar.height || ONE_LINE_TOOLBAR_PX;
  const { capabilities } = useCapabilities();
  const {
    materials,
    isLoading: isLoadingMaterials,
    error: materialsError,
    refetch,
  } = useMaterials();
  const { assignMaterial, clearMaterial, isUpdating } = useDesignAssignments(design);
  const { requestRender, isRequestingRender } = useDesignRender(design);
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
    // Short labels: the switch sits beside the render button, which supplies the context.
    { value: 'preview', label: 'Preview', icon: 'image' },
    {
      value: 'render',
      label: 'Photoreal',
      icon: 'camera',
      disabled: renderUrl === null,
      disabledReason: 'Generate a photoreal render first',
    },
  ];

  const handleGenerateRender = () => {
    view.setImageSource('render');
    requestRender();
  };

  return (
    <div className="space-y-5">
      <StepHeader
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <DesignCostSummary
            totals={estimate.estimate?.totals}
            isLoading={estimate.isLoading}
            isRefreshing={estimate.isFetching || isUpdating}
            hasError={Boolean(estimate.error)}
            isRough={project.scale === null}
          />
        }
      />

      {/*
        The row above the photo, as wide as it (or as wide as its controls on one line, if the
        photo is narrower): the design picker on the left, and on the right
        how you look at the photo (design or before / after) and which picture it is (the
        instant preview or the photoreal render). On the photo itself: names top right, the
        render button bottom centre.
      */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div
          ref={toolbar.ref}
          className="mx-auto flex min-w-fit max-w-full flex-wrap items-center justify-between gap-3"
          style={photoFrameStyle(image.width, image.height, toolbarHeight)}
        >
          <DesignSwitcher project={project} activeDesign={design} onSelect={onSelectDesign} />
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              items={VIEW_TABS}
              value={view.viewMode}
              onValueChange={view.setViewMode}
              variant="pill"
              label="Canvas view"
              className={ROW_TABS}
            />
            {photoreal.showsSourceSwitch && (
              <Tabs
                items={sourceTabs}
                value={showsRender ? 'render' : 'preview'}
                onValueChange={view.setImageSource}
                variant="pill"
                label="Picture type"
                className={ROW_TABS}
              />
            )}
          </div>
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

      {design.renderStatus === 'failed' && (
        <Alert
          tone="error"
          title="The photoreal render failed"
          action={
            <Button size="sm" variant="outline" onClick={handleGenerateRender}>
              Try again
            </Button>
          }
        >
          {design.renderError ?? 'Something went wrong while rendering.'} The instant preview is
          still accurate.
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div
          className="relative mx-auto min-w-0"
          style={photoFrameStyle(image.width, image.height, toolbarHeight)}
        >
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

          <NameTagToggle
            isOn={nameTags.isOn}
            onToggle={nameTags.toggle}
            disabled={view.viewMode === 'compare'}
            className="absolute right-4 top-4 z-10"
          />

          {isUpdating && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-10 hidden h-9 -translate-x-1/2 items-center gap-2 rounded-xl bg-ink/85 px-3 text-sm text-white md:flex">
              <Spinner size="sm" label="Updating preview" />
              Updating preview…
            </div>
          )}

          {photoreal.showsGenerate && (
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
              <RenderButton
                status={design.renderStatus}
                isRequesting={isRequestingRender}
                onGenerate={handleGenerateRender}
              />
            </div>
          )}
        </div>

        <MaterialPanel
          headerAction={<AdvisorButton />}
          maxHeight={maxPhotoHeight(toolbarHeight)}
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
