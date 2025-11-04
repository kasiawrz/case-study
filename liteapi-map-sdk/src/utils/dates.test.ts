import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getToday, getTomorrow } from './dates';

describe('Date Utils', () => {
  beforeEach(() => {
    // Reset date mocks before each test
    vi.useRealTimers();
  });

  describe('getToday', () => {
    it('should return current date in YYYY-MM-DD format', () => {
      const today = getToday();

      // Check format with regex
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const expected = new Date().toISOString().split('T')[0];
      expect(today).toBe(expected);
    });

    it('should pad single-digit months and days with zero', () => {
      // Mock a date with single digits: Jan 5, 2025
      const mockDate = new Date('2025-01-05');
      vi.setSystemTime(mockDate);

      const result = getToday();
      expect(result).toBe('2025-01-05');
    });
  });

  describe('getTomorrow', () => {
    it('should return tomorrow date in YYYY-MM-DD format', () => {
      const tomorrow = getTomorrow();

      expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 1);
      const expected = expectedDate.toISOString().split('T')[0];
      expect(tomorrow).toBe(expected);
    });

    it('should handle month boundaries correctly', () => {
      // Mock last day of month: Jan 31, 2025
      const mockDate = new Date('2025-01-31');
      vi.setSystemTime(mockDate);

      const result = getTomorrow();
      expect(result).toBe('2025-02-01'); // Should roll to next month
    });

    it('should handle year boundaries correctly', () => {
      // Mock last day of year: Dec 31, 2024
      const mockDate = new Date('2024-12-31');
      vi.setSystemTime(mockDate);

      const result = getTomorrow();
      expect(result).toBe('2025-01-01'); // Should roll to next year
    });
  });
});
