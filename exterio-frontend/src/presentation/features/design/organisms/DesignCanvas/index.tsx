import { ImageCanvas } from '@/presentation/shared/molecules/ImageCanvas';
import { RegionNameTag } from '@/presentation/shared/molecules/RegionNameTag';
import { layoutNameTags } from '@/presentation/shared/utils/nameTagLayout';
import { useSvgCanvas } from '@/presentation/shared/hooks/useSvgCanvas';
import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';
import { cn } from '@/presentation/shared/utils/cn';
import { sortByAreaDescending, toSvgPoints } from '@/presentation/shared/utils/geometry';
import type { ProjectImage, Region } from '@/domain/models/project';

export interface DesignCanvasProps {
  image: ProjectImage;
  /** The picture to show: instant preview, photoreal render or the original photo. */
  imageUrl: string;
  regions: Region[];
  selectedRegionId: string | null;
  hoveredRegionId: string | null;
  onSelectRegion: (regionId: string | null) => void;
  onHoverRegion: (regionId: string | null) => void;
  /** Draw each region's name on the photo. */
  showNames: boolean;
}

/** The redesigned house. Outlines appear on hover and selection; name tags can stay on. */
export function DesignCanvas({
  image,
  imageUrl,
  regions,
  selectedRegionId,
  hoveredRegionId,
  onSelectRegion,
  onHoverRegion,
  showNames,
}: DesignCanvasProps) {
  const { svgRef, unitsPerPixel } = useSvgCanvas(image.width, image.height);
  return (
    <ImageCanvas
      ref={svgRef}
      imageUrl={imageUrl}
      imageWidth={image.width}
      imageHeight={image.height}
      rowAbove
      label="Your house with the chosen finishes. Select a part to change its finish."
      onClick={() => onSelectRegion(null)}
    >
      {sortByAreaDescending(regions).map((region) => {
        const isSelected = region.id === selectedRegionId;
        const isHovered = region.id === hoveredRegionId;
        return (
          <polygon
            key={region.id}
            points={toSvgPoints(region.polygon)}
            strokeWidth={isSelected ? 3 : 2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={cn(
              'cursor-pointer transition-colors',
              isSelected && 'fill-white/10 stroke-white',
              !isSelected && isHovered && 'fill-white/15 stroke-white',
              !isSelected && !isHovered && 'fill-transparent stroke-transparent'
            )}
            onPointerEnter={() => onHoverRegion(region.id)}
            onPointerLeave={() => onHoverRegion(null)}
            onClick={(event) => {
              event.stopPropagation();
              onSelectRegion(region.id);
            }}
          >
            <title>{region.name}</title>
          </polygon>
        );
      })}
      {layoutNameTags(
        showNames
          ? regions
          : regions.filter((item) => item.id === selectedRegionId || item.id === hoveredRegionId),
        unitsPerPixel
      ).map((placement) => {
        const region = regions.find((item) => item.id === placement.id);
        return region ? (
          <RegionNameTag
            key={`name-${placement.id}`}
            placement={placement}
            color={REGION_LABEL_META[region.label].color}
            unitsPerPixel={unitsPerPixel}
            emphasised={placement.id === selectedRegionId || placement.id === hoveredRegionId}
          />
        ) : null;
      })}
    </ImageCanvas>
  );
}
