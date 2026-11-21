import { useState, type PointerEvent } from 'react';

import { ImageCanvas } from '@/presentation/shared/molecules/ImageCanvas';
import { RegionNameTag } from '@/presentation/shared/molecules/RegionNameTag';
import { layoutNameTags } from '@/presentation/shared/utils/nameTagLayout';
import { SvgDragHandle } from '@/presentation/shared/molecules/SvgDragHandle';
import { useSvgCanvas } from '@/presentation/shared/hooks/useSvgCanvas';
import { cn } from '@/presentation/shared/utils/cn';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';
import {
  closestPointOnSegment,
  roundPoint,
  sortByAreaDescending,
  toSvgPoints,
} from '@/presentation/shared/utils/geometry';
import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';
import type { Point, ProjectImage, Region } from '@/domain/models/project';

const DRAW_COLOR = '#ffffff';
const DRAW_POINT_RADIUS_PX = 5;
const CLOSE_POINT_RADIUS_PX = 9;
const CLOSE_HIT_RADIUS_PX = 16;

export interface RegionCanvasProps {
  image: ProjectImage;
  regions: Region[];
  selectedRegionId: string | null;
  selectedVertexIndex: number | null;
  isDrawing: boolean;
  drawPoints: Point[];
  canFinishDrawing: boolean;
  onSelectRegion: (regionId: string | null) => void;
  onSelectVertex: (index: number | null) => void;
  onMoveVertex: (regionId: string, index: number, point: Point) => void;
  onInsertVertex: (regionId: string, afterIndex: number, point: Point) => void;
  onRemoveVertex: (regionId: string, index: number) => void;
  onAddDrawPoint: (point: Point) => void;
  onFinishDrawing: () => void;
  /** Draw each region's name on the photo. */
  showNames: boolean;
}

/**
 * The region editor canvas. The SVG viewBox equals the image size, so every polygon is
 * stored and drawn in image pixel coordinates no matter how the canvas is scaled.
 */
export function RegionCanvas({
  image,
  regions,
  selectedRegionId,
  selectedVertexIndex,
  isDrawing,
  drawPoints,
  canFinishDrawing,
  onSelectRegion,
  onSelectVertex,
  onMoveVertex,
  onInsertVertex,
  onRemoveVertex,
  onAddDrawPoint,
  onFinishDrawing,
  showNames,
}: RegionCanvasProps) {
  const { svgRef, unitsPerPixel, toImagePoint } = useSvgCanvas(image.width, image.height);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? null;

  const handleCanvasPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) {
      return;
    }
    if (!isDrawing) {
      onSelectRegion(null);
      return;
    }
    const point = toImagePoint(event.clientX, event.clientY);
    if (point) {
      onAddDrawPoint(point);
    }
  };

  const handleCanvasPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    // The rubber-band line only makes sense for a hovering pointer.
    if (isDrawing && event.pointerType === 'mouse') {
      setHoverPoint(toImagePoint(event.clientX, event.clientY));
    }
  };

  const previewPoints = isDrawing && hoverPoint ? [...drawPoints, hoverPoint] : drawPoints;
  const firstDrawPoint = drawPoints[0];

  return (
    <ImageCanvas
      ref={svgRef}
      imageUrl={resolveFileUrl(image.url)}
      imageWidth={image.width}
      imageHeight={image.height}
      label="House photo with marked regions"
      className={cn('touch-none', isDrawing && 'cursor-crosshair')}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerLeave={() => setHoverPoint(null)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {sortByAreaDescending(regions).map((region) => {
        if (region.id === selectedRegionId) {
          return null;
        }
        const { color } = REGION_LABEL_META[region.label];
        return (
          <polygon
            key={region.id}
            points={toSvgPoints(region.polygon)}
            fill={color}
            fillOpacity={0.28}
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={cn(
              'transition-[fill-opacity] hover:[fill-opacity:0.45]',
              isDrawing ? 'pointer-events-none' : 'cursor-pointer'
            )}
            onPointerDown={(event) => {
              if (event.button === 0) {
                event.stopPropagation();
                onSelectRegion(region.id);
              }
            }}
          >
            <title>{region.name}</title>
          </polygon>
        );
      })}

      {selectedRegion && !isDrawing && (
        <g>
          <polygon
            points={toSvgPoints(selectedRegion.polygon)}
            fill={REGION_LABEL_META[selectedRegion.label].color}
            fillOpacity={0.4}
            stroke="#ffffff"
            strokeWidth={4.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            onPointerDown={(event) => event.stopPropagation()}
          />
          <polygon
            points={toSvgPoints(selectedRegion.polygon)}
            fill="none"
            stroke={REGION_LABEL_META[selectedRegion.label].color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none"
          />
          {selectedRegion.polygon.map((start, index) => {
            const end = selectedRegion.polygon[(index + 1) % selectedRegion.polygon.length];
            return (
              <line
                key={`edge-${index}`}
                x1={start[0]}
                y1={start[1]}
                x2={end[0]}
                y2={end[1]}
                stroke="transparent"
                strokeWidth={16}
                vectorEffect="non-scaling-stroke"
                className="cursor-copy [pointer-events:stroke]"
                onPointerDown={(event) => event.stopPropagation()}
                onDoubleClick={(event) => {
                  const point = toImagePoint(event.clientX, event.clientY);
                  if (point) {
                    onInsertVertex(
                      selectedRegion.id,
                      index,
                      roundPoint(closestPointOnSegment(point, start, end))
                    );
                    onSelectVertex(index + 1);
                  }
                }}
              >
                <title>Double-click to add a point here</title>
              </line>
            );
          })}
          {selectedRegion.polygon.map((point, index) => (
            <SvgDragHandle
              key={`vertex-${index}`}
              point={point}
              unitsPerPixel={unitsPerPixel}
              toImagePoint={toImagePoint}
              tone={index === selectedVertexIndex ? 'selected' : 'default'}
              label={`Point ${index + 1} of ${selectedRegion.name}. Drag to move, right-click to remove.`}
              onPress={() => onSelectVertex(index)}
              onDrag={(next) => onMoveVertex(selectedRegion.id, index, next)}
              onRemove={() => onRemoveVertex(selectedRegion.id, index)}
            />
          ))}
        </g>
      )}

      {showNames &&
        !isDrawing &&
        layoutNameTags(regions, unitsPerPixel).map((placement) => {
          const region = regions.find((item) => item.id === placement.id);
          return region ? (
            <RegionNameTag
              key={`name-${placement.id}`}
              placement={placement}
              color={REGION_LABEL_META[region.label].color}
              unitsPerPixel={unitsPerPixel}
              emphasised={placement.id === selectedRegionId}
            />
          ) : null;
        })}

      {isDrawing && firstDrawPoint && (
        <g>
          <polyline
            points={toSvgPoints(previewPoints)}
            fill="none"
            stroke="#1c1917"
            strokeWidth={4}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none"
          />
          <polyline
            points={toSvgPoints(previewPoints)}
            fill="none"
            stroke={DRAW_COLOR}
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none"
          />
          {drawPoints.slice(1).map((point, index) => (
            <circle
              key={`draw-${index}`}
              cx={point[0]}
              cy={point[1]}
              r={DRAW_POINT_RADIUS_PX * unitsPerPixel}
              fill={DRAW_COLOR}
              stroke="#1c1917"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              className="pointer-events-none"
            />
          ))}
          <circle
            cx={firstDrawPoint[0]}
            cy={firstDrawPoint[1]}
            r={(canFinishDrawing ? CLOSE_POINT_RADIUS_PX : DRAW_POINT_RADIUS_PX) * unitsPerPixel}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className={cn(
              'pointer-events-none stroke-ink',
              canFinishDrawing ? 'fill-emerald-400' : 'fill-white'
            )}
          />
          {canFinishDrawing && (
            <circle
              cx={firstDrawPoint[0]}
              cy={firstDrawPoint[1]}
              r={CLOSE_HIT_RADIUS_PX * unitsPerPixel}
              role="button"
              aria-label="Close the shape"
              className="cursor-pointer fill-transparent"
              onPointerDown={(event) => {
                event.stopPropagation();
                onFinishDrawing();
              }}
            >
              <title>Click to close the shape</title>
            </circle>
          )}
        </g>
      )}
    </ImageCanvas>
  );
}
