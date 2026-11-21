/**
 * What every page is drawn on: drafting paper with a grid so faint it reads as texture. It stays
 * put while the content scrolls, and it is deliberately quiet; the content on it is what the eye
 * should find first.
 *
 * Render it once, inside a layout root marked `isolate` so it stays behind the page.
 */
export function PageBackdrop() {
  return (
    <div
      aria-hidden
      data-testid="page-grid"
      className="pointer-events-none fixed inset-0 -z-10 bg-stone-50 bg-paper-grid bg-mat-grid"
    />
  );
}
