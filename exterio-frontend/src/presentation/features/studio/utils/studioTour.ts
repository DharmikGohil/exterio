import type { StudioStep } from '@/presentation/routes/paths';
import type { PageTour, TourSection, TourStep } from '@/presentation/shared/utils/guidedTour';

/** Shown once, before the first studio step a visitor opens, and on every replay. */
const STUDIO_INTRO: TourSection = {
  id: 'studio-intro',
  steps: [
    {
      target: 'studio-stepper',
      title: 'Five steps, from photo to price',
      body: 'Photo, Regions, Design, Scale and Estimate. Scale is optional. Click any step you have reached to go back to it; your work is saved as you go.',
    },
  ],
};

const ADVISOR_STEP: TourStep = {
  target: 'advisor',
  title: 'Ask about materials',
  body: 'Questions about a finish, the weather where you live, or your estimate? The material advisor answers with this house’s parts and costs in mind.',
};

const CONTINUE_STEP: TourStep = {
  target: 'step-footer',
  title: 'Move on when you are ready',
  body: 'Continue takes you to the next step. A short tour like this one shows the first time you open each step.',
};

const STEPS: Record<StudioStep, TourStep[]> = {
  photo: [
    {
      target: 'photo-area',
      title: 'Start with one photo',
      body: 'A clear daylight photo of the front of the house. It is checked for sharpness, light and size, and the AI confirms it shows a house; if something is off, you get a tip for a better shot.',
    },
    ADVISOR_STEP,
    CONTINUE_STEP,
  ],
  regions: [
    {
      target: 'region-tools',
      title: 'Mark the parts of the house',
      body: 'Auto-detect lets the AI outline the walls, roof, windows and doors; you see each part appear as it is found. Draw region adds anything it missed.',
    },
    {
      target: 'region-photo',
      title: 'Fix anything that is off',
      body: 'Click a shape to select it, then drag its corners. Undo with Ctrl+Z. Every shape is one part that can get its own finish.',
    },
    {
      target: 'region-list',
      title: 'Every part, listed',
      body: 'Rename a part, change what kind it is, or delete it here.',
    },
    CONTINUE_STEP,
  ],
  design: [
    {
      target: 'material-panel',
      title: 'Choose the finishes',
      body: 'Pick a part on the photo, then a paint, texture, stone, tile, panel or railing. The preview updates straight away.',
    },
    {
      target: 'render-button',
      title: 'See it for real',
      body: 'Generate render makes a photoreal AI picture of your design in about 15 seconds. Only the parts you changed are touched.',
    },
    {
      target: 'design-switcher',
      title: 'Compare ideas',
      body: 'Make Design B or C to try other finishes on the same house, then compare their costs.',
    },
    {
      target: 'design-cost',
      title: 'A running total',
      body: 'A rough total while you design. Set the real size in Scale for a firmer number.',
    },
    ADVISOR_STEP,
    CONTINUE_STEP,
  ],
  scale: [
    {
      target: 'scale-photo',
      title: 'Outline the front wall',
      body: 'Drag the four corners onto the corners of the main wall. This also corrects for a photo taken at an angle.',
    },
    {
      target: 'scale-form',
      title: 'Give one real size',
      body: 'The wall’s width and height gives the most exact price. A door or the number of floors also works, with a wider price range.',
    },
    CONTINUE_STEP,
  ],
  estimate: [
    {
      target: 'estimate-summary',
      title: 'Your estimate',
      body: 'The total, a low to high range, and how sure it is. Open the full breakdown to change a rate, the wastage or an area.',
    },
    {
      target: 'estimate-pdf',
      title: 'Take it to a contractor',
      body: 'Download a PDF with the before and after pictures and every quantity and cost.',
    },
  ],
};

function tourFor(step: StudioStep): PageTour {
  return { id: `studio-${step}`, intro: STUDIO_INTRO, steps: STEPS[step] };
}

/** One tour per studio step, built once so the same step always gets the same object. */
export const STUDIO_TOURS: Record<StudioStep, PageTour> = {
  photo: tourFor('photo'),
  regions: tourFor('regions'),
  design: tourFor('design'),
  scale: tourFor('scale'),
  estimate: tourFor('estimate'),
};
