import { describe, expect, it } from 'vitest';

import {
  formatDate,
  formatInr,
  formatNumber,
  formatUnit,
  pluralise,
} from '@/presentation/shared/utils/format';

describe('format', () => {
  it('formats rupees with Indian digit grouping and no paise', () => {
    expect(formatInr(125000)).toBe('₹1,25,000');
    expect(formatInr(65724.56)).toBe('₹65,725');
  });

  it('formats plain numbers with Indian grouping and limited decimals', () => {
    expect(formatNumber(1234567.891)).toBe('12,34,567.9');
    expect(formatNumber(2.345, 2)).toBe('2.35');
  });

  it('names units the way a homeowner reads them', () => {
    expect(formatUnit('sqft')).toBe('sq ft');
    expect(formatUnit('rft')).toBe('running ft');
    expect(formatUnit('kg')).toBe('kg');
  });

  it('pluralises with an optional irregular plural', () => {
    expect(pluralise(1, 'design')).toBe('1 design');
    expect(pluralise(3, 'design')).toBe('3 designs');
    expect(pluralise(2, 'balcony', 'balconies')).toBe('2 balconies');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatDate('not a date')).toBe('');
    expect(formatDate('2026-11-21T10:00:00Z')).toBe('21 Nov 2026');
  });
});
