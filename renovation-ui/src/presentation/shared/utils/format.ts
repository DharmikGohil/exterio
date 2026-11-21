const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Rupees with Indian digit grouping, e.g. ₹1,25,000. */
export function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}

/** A plain number with Indian digit grouping and at most `maximumFractionDigits` decimals. */
export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits }).format(value);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

const UNIT_LABELS: Record<string, string> = {
  sqft: 'sq ft',
  rft: 'running ft',
};

/** Human label for a measurement unit (`sqft` -> "sq ft", `rft` -> "running ft"). */
export function formatUnit(unit: string): string {
  return UNIT_LABELS[unit] ?? unit;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
