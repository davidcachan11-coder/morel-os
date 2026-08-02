import "server-only";

/**
 * Preset ranges only (no custom calendar picker yet — see docs/DECISIONS.md's
 * Admin Platform entry: no date-range library is installed, and with the
 * project's current order history spanning under two hours, a custom
 * calendar adds real UI surface for a range that's mostly empty anyway).
 */
export const ANALYTICS_PERIODS = ["today", "7d", "30d", "month"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: "Hoy",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  month: "Este mes",
};

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Current period + the immediately preceding, equal-length period, for
 * period-over-period comparison (Phase 2: "today vs yesterday," etc.).
 * `end` is always `now` for the current range — these are rolling windows
 * up to the moment of the query, not calendar-aligned-to-midnight buckets,
 * except "today" and "month" which are anchored to their natural boundary.
 */
export function resolvePeriodRanges(
  period: AnalyticsPeriod,
  now: Date = new Date()
): { current: DateRange; previous: DateRange } {
  switch (period) {
    case "today": {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      return {
        current: { start: startOfToday, end: now },
        previous: { start: startOfYesterday, end: startOfToday },
      };
    }
    case "7d": {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return { current: { start, end: now }, previous: { start: prevStart, end: start } };
    }
    case "30d": {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      return { current: { start, end: now }, previous: { start: prevStart, end: start } };
    }
    case "month": {
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        current: { start: startOfThisMonth, end: now },
        previous: { start: startOfLastMonth, end: startOfThisMonth },
      };
    }
  }
}

/**
 * Percentage change, `null` when there's no honest baseline to compare
 * against — SECURITY_ARCHITECTURE.md's neighbor-doc discipline of "don't
 * invent business data" extends here: a previous period with zero orders
 * makes any growth percentage fabricated (0 → N is not "+∞%" in any
 * meaningful sense), so callers must render an explicit "sin datos previos"
 * state instead of a number. Both-zero is a real, meaningful 0% (no change).
 */
export function computeDeltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** Daily buckets for multi-day ranges, hourly for "today" (sub-24h) ranges. */
export function bucketGranularity(period: AnalyticsPeriod): "hour" | "day" {
  return period === "today" ? "hour" : "day";
}
