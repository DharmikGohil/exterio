import type { PageTour } from '@/presentation/shared/utils/guidedTour';

/** The first thing a new visitor sees after signing in: what the app does and where to start. */
export const HOUSES_TOUR: PageTour = {
  id: 'houses',
  steps: [
    {
      title: 'Welcome to Exterio',
      body: 'Upload one photo of a house, try new paint, stone or cladding on it, and get the quantities and a rupee estimate to take to a contractor. This tour takes under a minute.',
    },
    {
      target: 'project-card',
      title: 'Your houses',
      body: 'Each card is one house: its photo, how far it has got in the five steps, and its latest estimate. Click a card to open it where you left off.',
    },
    {
      target: 'new-project',
      title: 'Start a new house',
      body: 'Create a project for a house, then upload a photo of its front. One project can hold several designs to compare.',
    },
    {
      target: 'sample-house',
      title: 'No photo to hand?',
      body: 'Open a ready-made sample house to try every step first.',
    },
    {
      target: 'tour-button',
      title: 'Help on every page',
      body: 'Click this button any time to see the tour for the page you are on.',
    },
  ],
};
