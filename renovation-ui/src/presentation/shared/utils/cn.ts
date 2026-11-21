import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's built-in utilities and would treat the project's own
 * background tokens (see tailwind.config.ts) as colours, dropping all but one. Declaring their
 * groups keeps the grids with their sizes and colours.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'bg-image': ['bg-cutting-mat', 'bg-paper-grid'],
      'bg-size': ['bg-mat-grid'],
    },
  },
});

/** Merges conditional class names and resolves conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
