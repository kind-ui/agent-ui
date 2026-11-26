import { addDays, isISODate, startOfWeek } from "@ui-sdk/core/date";
import type { ActivityDay } from "../../types/index.js";

/** A day in the graph: its date, its count, and whether it's after `now`. */
export interface ActivityCell {
  date: string;
  count: number;
  future: boolean;
}

/** A column of the graph: seven days from the week's first day. */
export interface ActivityWeek {
  start: string;
  days: ActivityCell[];
}

export interface ActivityWeeksOptions {
  /** The last day shown, `YYYY-MM-DD`; its week is the last column. */
  now: string;
  /** How many weeks, oldest first, ending with `now`'s. */
  weeks: number;
  /** The weeks' first day, 0 for Sunday to 6 for Saturday. */
  weekStart: number;
}

/**
 * The weeks that end with `now`'s, oldest first, each holding seven days from `weekStart`. A day's count is the sum of
 * its entries in `days`; days after `now` are `future`. Entries without a real date are left out.
 */
export const activityWeeks = (
  days: readonly ActivityDay[],
  { now, weeks, weekStart }: ActivityWeeksOptions,
): ActivityWeek[] => {
  const counts = new Map<string, number>();
  for (const { date, count } of days)
    if (isISODate(date) && Number.isFinite(count)) counts.set(date, (counts.get(date) ?? 0) + count);
  const first = addDays(startOfWeek(now, weekStart), -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, col) => {
    const start = addDays(first, col * 7);
    return {
      start,
      days: Array.from({ length: 7 }, (_, row) => {
        const date = addDays(start, row);
        return { date, count: counts.get(date) ?? 0, future: date > now };
      }),
    };
  });
};

/**
 * Each count's level: 0 for none, else 1 to `levels` by quantile over the counts above zero, so the busiest day is
 * always the top level and each level holds about as many days as the next.
 */
export const activityLevels = (counts: readonly number[], levels: number): number[] => {
  const positive = counts.filter((count) => count > 0).sort((a, b) => a - b);
  // How many counts above zero are at most `count`.
  const atOrBelow = (count: number) => {
    let low = 0;
    let high = positive.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if ((positive[mid] as number) <= count) low = mid + 1;
      else high = mid;
    }
    return low;
  };
  return counts.map((count) =>
    count > 0 ? Math.max(1, Math.ceil((levels * atOrBelow(count)) / positive.length)) : 0,
  );
};
