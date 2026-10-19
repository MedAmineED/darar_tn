import { comparisonMetric, dailySeries, reportingWindow } from './period';

const now = new Date('2026-10-15T23:30:00.000Z');

describe('Tunis reporting windows', () => {
  it('defaults to 30 inclusive Tunis calendar days across the UTC day boundary', () => {
    const window = reportingWindow({}, now);
    expect(window.from).toBe('2026-09-17');
    expect(window.to).toBe('2026-10-16');
    expect(window.start.toISOString()).toBe('2026-09-16T23:00:00.000Z');
    expect(window.end.toISOString()).toBe('2026-10-16T23:00:00.000Z');
    expect(window.days).toBe(30);
    expect(window.previousFrom).toBe('2026-08-18');
    expect(window.previousTo).toBe('2026-09-16');
    expect(window.previousEnd).toEqual(window.start);
  });

  it('includes the complete final day, handles leap day, and compares an equal window', () => {
    const window = reportingWindow(
      { from: '2024-02-28', to: '2024-03-01' },
      now,
    );
    expect(window.days).toBe(3);
    expect(window.end.toISOString()).toBe('2024-03-01T23:00:00.000Z');
    expect(window.previousFrom).toBe('2024-02-25');
    expect(window.previousTo).toBe('2024-02-27');
  });

  it('allows exactly 366 days and rejects longer windows', () => {
    expect(
      reportingWindow({ from: '2024-01-01', to: '2024-12-31' }, now).days,
    ).toBe(366);
    expect(() =>
      reportingWindow({ from: '2024-01-01', to: '2025-01-01' }, now),
    ).toThrow();
  });

  it.each([
    { from: '2026-02-30', to: '2026-03-01' },
    { from: '2026-10-16', to: '2026-10-15' },
    { from: '2026-10-01' },
    { to: '2026-10-01' },
    { from: '2026-1-01', to: '2026-01-02' },
    { from: '2026-10-01T00:00:00Z', to: '2026-10-02' },
  ])('rejects invalid or incomplete custom ranges: %j', (query) => {
    expect(() => reportingWindow(query, now)).toThrow();
  });
});

describe('dashboard metric policy', () => {
  it('shows no invented percentage when the previous baseline is zero', () => {
    expect(comparisonMetric(100, 0)).toEqual({
      value: 100,
      previousValue: 0,
      changePercent: null,
    });
    expect(comparisonMetric(0, 0).changePercent).toBeNull();
    expect(comparisonMetric(0, 100).changePercent).toBe(-100);
    expect(comparisonMetric(125, 100).changePercent).toBe(25);
  });

  it('zero-fills only the bounded inclusive date window from aggregate rows', () => {
    const window = reportingWindow(
      { from: '2026-10-14', to: '2026-10-16' },
      now,
    );
    expect(
      dailySeries(window, [{ date: '2026-10-15', revenue: 42.5, orders: 2 }]),
    ).toEqual([
      { date: '2026-10-14', revenue: 0, orders: 0 },
      { date: '2026-10-15', revenue: 42.5, orders: 2 },
      { date: '2026-10-16', revenue: 0, orders: 0 },
    ]);
  });
});
