'use strict';

const { now, format, addMonths, diffDays, isPastDue } = require('../../src/utils/date');

describe('date utils', () => {

  describe('now', () => {
    it('returns a Date object', () => {
      expect(now()).toBeInstanceOf(Date);
    });
    it('is close to current time (within 1 second)', () => {
      const diff = Math.abs(Date.now() - now().getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('format', () => {
    it('formats date as YYYY-MM-DD by default', () => {
      const d = new Date('2026-04-15T10:00:00Z');
      expect(format(d)).toBe('2026-04-15');
    });
    it('respects custom format string', () => {
      const d = new Date('2026-01-05T00:00:00Z');
      expect(format(d, 'DD/MM/YYYY')).toBe('05/01/2026');
    });
  });

  describe('addMonths', () => {
    it('adds months correctly', () => {
      const base   = new Date('2026-01-15T00:00:00Z');
      const result = addMonths(base, 3);
      expect(format(result)).toBe('2026-04-15');
    });
    it('handles year rollover', () => {
      const base   = new Date('2026-11-30T00:00:00Z');
      const result = addMonths(base, 3);
      expect(format(result)).toBe('2027-02-28'); // Feb has 28 days
    });
  });

  describe('diffDays', () => {
    it('calculates positive day difference', () => {
      const a = new Date('2026-01-01');
      const b = new Date('2026-01-11');
      expect(diffDays(a, b)).toBe(10);
    });
    it('returns negative for past dates', () => {
      const a = new Date('2026-01-11');
      const b = new Date('2026-01-01');
      expect(diffDays(a, b)).toBe(-10);
    });
  });

  describe('isPastDue', () => {
    it('returns true for a past date', () => {
      expect(isPastDue(new Date('2020-01-01'))).toBe(true);
    });
    it('returns false for a future date', () => {
      expect(isPastDue(new Date('2099-01-01'))).toBe(false);
    });
  });

});