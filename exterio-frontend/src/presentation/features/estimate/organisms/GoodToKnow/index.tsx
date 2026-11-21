export interface GoodToKnowProps {
  notes: readonly string[];
  /** Which parts are left out because they have no finish yet, if any. */
  leftOut: string | null;
}

/** The few things a homeowner should know before trusting the numbers. */
export function GoodToKnow({ notes, leftOut }: GoodToKnowProps) {
  return (
    <aside className="space-y-5 self-start rounded-2xl border border-stone-200 bg-white p-6 lg:sticky lg:top-6">
      <h2 className="text-xl font-medium text-stone-900">Good to know</h2>
      <ul className="list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-stone-700 marker:text-stone-400">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      {leftOut && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] leading-snug text-amber-900">
          {leftOut}
        </p>
      )}
      <p className="text-sm text-stone-500">
        This is a guide to share with your contractor, not a quotation.
      </p>
    </aside>
  );
}
