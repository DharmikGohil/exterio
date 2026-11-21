/**
 * The horizontal frame every layout lays its content in: full window width, with side padding
 * that grows with the screen. Headers, pages and the studio's pinned step bar share it, so their
 * edges line up. `PAGE_FRAME_BLEED` is the negative margin that lets a bar run edge to edge.
 */
export const PAGE_FRAME = 'w-full px-4 sm:px-8 xl:px-10';
export const PAGE_FRAME_BLEED = '-mx-4 px-4 sm:-mx-8 sm:px-8 xl:-mx-10 xl:px-10';
