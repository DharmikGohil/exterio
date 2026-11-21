import { ImageCanvas } from '@/presentation/shared/molecules/ImageCanvas';
import { SvgDimension } from '@/presentation/shared/molecules/SvgDimension';
import { SvgDragHandle } from '@/presentation/shared/molecules/SvgDragHandle';
import { useSvgCanvas } from '@/presentation/shared/hooks/useSvgCanvas';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';
import { toSvgPoints } from '@/presentation/shared/utils/geometry';
import {
  FACADE_CORNER_CAPTIONS,
  FACADE_CORNER_NAMES,
  FEET_PER_STOREY,
} from '@/presentation/features/studio/utils/scaleDefaults';
import { REGION_LABEL_META } from '@/presentation/shared/utils/regionLabels';
import type { Point, ProjectImage, Region, ScaleReference } from '@/domain/models/project';

const REFERENCE_COLOR = '#0ea5e9';
const DIMENSION_OFFSET_PX = 22;

function formatFeet(value: number | null, missing: string): string {
  return value && value > 0 ? `${Number(value.toFixed(1))} ft` : missing;
}

function centreOf(points: Point[]): Point {
  const sum = points.reduce((total, point) => [total[0] + point[0], total[1] + point[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

export interface ScaleCanvasProps {
  image: ProjectImage;
  scale: ScaleReference;
  /** Door regions are outlined while the door is the reference. */
  doorRegions: Region[];
  onMoveCorner: (index: number, point: Point) => void;
  onMoveReferencePoint: (index: 0 | 1, point: Point) => void;
}

/** The photo with the draggable facade outline and, when used, the reference line. */
export function ScaleCanvas({
  image,
  scale,
  doorRegions,
  onMoveCorner,
  onMoveReferencePoint,
}: ScaleCanvasProps) {
  const { svgRef, unitsPerPixel, toImagePoint } = useSvgCanvas(image.width, image.height);
  const referenceLine = scale.method === 'reference_line' ? scale.referenceLine : null;
  const [topLeft, topRight, , bottomLeft] = scale.facadeCorners;
  const wallCentre = centreOf(scale.facadeCorners);

  return (
    <ImageCanvas
      ref={svgRef}
      imageUrl={resolveFileUrl(image.url)}
      imageWidth={image.width}
      imageHeight={image.height}
      label="House photo with the main wall outlined"
      className="touch-none"
    >
      {scale.method === 'door_height' &&
        doorRegions.map((region) => (
          <polygon
            key={region.id}
            points={toSvgPoints(region.polygon)}
            fill={REGION_LABEL_META.door.color}
            fillOpacity={0.35}
            stroke={REGION_LABEL_META.door.color}
            strokeWidth={2.5}
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none"
          />
        ))}

      <polygon
        points={toSvgPoints(scale.facadeCorners)}
        strokeWidth={5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="pointer-events-none fill-none stroke-ink/70"
      />
      <polygon
        points={toSvgPoints(scale.facadeCorners)}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeDasharray="10 6"
        vectorEffect="non-scaling-stroke"
        className="pointer-events-none fill-brand-500/10 stroke-white"
      />
      {scale.method === 'facade_dimensions' && (
        <>
          <SvgDimension
            start={topLeft}
            end={topRight}
            awayFrom={wallCentre}
            label={formatFeet(scale.facadeWidthFt, 'Width?')}
            isPending={!scale.facadeWidthFt}
            offsetPx={DIMENSION_OFFSET_PX}
            unitsPerPixel={unitsPerPixel}
          />
          <SvgDimension
            start={topLeft}
            end={bottomLeft}
            awayFrom={wallCentre}
            label={formatFeet(scale.facadeHeightFt, 'Height?')}
            isPending={!scale.facadeHeightFt}
            offsetPx={DIMENSION_OFFSET_PX}
            unitsPerPixel={unitsPerPixel}
          />
        </>
      )}
      {scale.method === 'storey_height' && (
        <SvgDimension
          start={topLeft}
          end={bottomLeft}
          awayFrom={wallCentre}
          label={
            scale.storeys > 0
              ? `${scale.storeys} ${scale.storeys === 1 ? 'floor' : 'floors'} · ~${scale.storeys * FEET_PER_STOREY} ft`
              : 'Floors?'
          }
          isPending={!(scale.storeys > 0)}
          offsetPx={DIMENSION_OFFSET_PX}
          unitsPerPixel={unitsPerPixel}
        />
      )}

      {scale.facadeCorners.map((corner, index) => (
        <SvgDragHandle
          key={FACADE_CORNER_CAPTIONS[index]}
          point={corner}
          unitsPerPixel={unitsPerPixel}
          toImagePoint={toImagePoint}
          tone="selected"
          caption={FACADE_CORNER_CAPTIONS[index]}
          label={`${FACADE_CORNER_NAMES[index]} of the main wall. Drag to move.`}
          onDrag={(point) => onMoveCorner(index, point)}
        />
      ))}

      {referenceLine && (
        <g>
          <line
            x1={referenceLine[0][0]}
            y1={referenceLine[0][1]}
            x2={referenceLine[1][0]}
            y2={referenceLine[1][1]}
            stroke="#ffffff"
            strokeWidth={6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none"
          />
          <line
            x1={referenceLine[0][0]}
            y1={referenceLine[0][1]}
            x2={referenceLine[1][0]}
            y2={referenceLine[1][1]}
            stroke={REFERENCE_COLOR}
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none"
          />
          <SvgDragHandle
            point={referenceLine[0]}
            unitsPerPixel={unitsPerPixel}
            toImagePoint={toImagePoint}
            tone="accent"
            caption="A"
            label="Start of the known measurement. Drag to move."
            onDrag={(point) => onMoveReferencePoint(0, point)}
          />
          <SvgDragHandle
            point={referenceLine[1]}
            unitsPerPixel={unitsPerPixel}
            toImagePoint={toImagePoint}
            tone="accent"
            caption="B"
            label="End of the known measurement. Drag to move."
            onDrag={(point) => onMoveReferencePoint(1, point)}
          />
          <SvgDimension
            start={referenceLine[0]}
            end={referenceLine[1]}
            awayFrom={wallCentre}
            label={formatFeet(scale.referenceLengthFt, 'Length?')}
            isPending={!scale.referenceLengthFt}
            offsetPx={0}
            unitsPerPixel={unitsPerPixel}
          />
        </g>
      )}
    </ImageCanvas>
  );
}
