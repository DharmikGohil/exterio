import type {
  FacadeCorners,
  Point,
  ProjectImage,
  Region,
  ScaleMethod,
  ScaleReference,
} from '@/domain/models/project';
import { getBounds, roundPoint } from '@/presentation/shared/utils/geometry';

const INSET_RATIO = 0.1;
export const DEFAULT_DOOR_HEIGHT_FT = 7;
export const FEET_PER_STOREY = 10;

/** The bounding box of the marked walls, or a rectangle inset from the photo edges. */
export function buildDefaultCorners(
  image: ProjectImage,
  regions: readonly Region[]
): FacadeCorners {
  const wallPoints = regions
    .filter((region) => region.label === 'wall')
    .flatMap((region) => region.polygon);
  const bounds = getBounds(wallPoints) ?? {
    minX: image.width * INSET_RATIO,
    minY: image.height * INSET_RATIO,
    maxX: image.width * (1 - INSET_RATIO),
    maxY: image.height * (1 - INSET_RATIO),
  };
  return [
    roundPoint([bounds.minX, bounds.minY]),
    roundPoint([bounds.maxX, bounds.minY]),
    roundPoint([bounds.maxX, bounds.maxY]),
    roundPoint([bounds.minX, bounds.maxY]),
  ];
}

/** A horizontal line across the middle of the photo, ready to be dragged into place. */
export function buildDefaultReferenceLine(image: ProjectImage): [Point, Point] {
  const y = image.height * 0.6;
  return [roundPoint([image.width * 0.35, y]), roundPoint([image.width * 0.65, y])];
}

/** The starting point for a project that has no saved scale yet. */
export function buildDefaultScale(image: ProjectImage, regions: readonly Region[]): ScaleReference {
  return {
    method: 'facade_dimensions',
    facadeCorners: buildDefaultCorners(image, regions),
    referenceLine: null,
    referenceLengthFt: null,
    facadeWidthFt: null,
    facadeHeightFt: null,
    storeys: 1,
    doorHeightFt: DEFAULT_DOOR_HEIGHT_FT,
  };
}

export interface ScaleMethodMeta {
  title: string;
  description: string;
  /** One or two words for the segmented picker. */
  shortTitle: string;
  accuracy: string;
  accuracyTone: 'success' | 'info' | 'warning';
}

export const SCALE_METHOD_META: Record<ScaleMethod, ScaleMethodMeta> = {
  facade_dimensions: {
    title: 'I know the wall size',
    shortTitle: 'Wall size',
    description: 'Type the real width and height of the wall you outlined.',
    accuracy: 'Most accurate',
    accuracyTone: 'success',
  },
  reference_line: {
    title: 'I know one measurement',
    shortTitle: 'One length',
    description:
      'Drag points A and B on the photo onto the ends of a length you know, like the gate, and type how long it really is.',
    accuracy: 'Accurate',
    accuracyTone: 'success',
  },
  door_height: {
    title: 'Use the door as reference',
    shortTitle: 'Door',
    description:
      'Most main doors are about 7 ft tall. The door you marked becomes the ruler; change its height only if yours is unusual.',
    accuracy: 'Good',
    accuracyTone: 'info',
  },
  storey_height: {
    title: 'Estimate from floors',
    shortTitle: 'Floors',
    description: `No measurements handy? Count the floors in the photo; we assume about ${FEET_PER_STOREY} ft each.`,
    accuracy: 'Rough',
    accuracyTone: 'warning',
  },
};

export const FACADE_CORNER_CAPTIONS = ['TL', 'TR', 'BR', 'BL'] as const;
export const FACADE_CORNER_NAMES = [
  'Top-left corner',
  'Top-right corner',
  'Bottom-right corner',
  'Bottom-left corner',
] as const;
