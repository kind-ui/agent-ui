import type { TokenUsage } from "../../types/index.js";

/** One line of the details: what it counts, and its formatted value. */
export type ContextRow = { label: string; value: string };

/** How much of the window `used` takes, from 0 to 1. */
export const contextRatio = (used: number, total: number): number =>
  total > 0 ? Math.min(Math.max(used / total, 0), 1) : 0;

/** The meter's value for screen readers, like "57,600 of 128,000 tokens, 45%". */
export function contextValueText(used: number, total: number, locale?: string): string {
  const count = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  return `${count.format(used)} of ${count.format(total)} tokens, ${percent.format(contextRatio(used, total))}`;
}

const TOKEN_ROWS = [
  ["input", "Input"],
  ["output", "Output"],
  ["reasoning", "Reasoning"],
  ["cached", "Cached"],
] as const;

/** The details' lines: only the counts and cost supplied, in the order input, output, reasoning, cached, cost. */
export function contextRows(
  usage?: { [Key in keyof TokenUsage]?: number | undefined },
  cost?: number,
  currency = "USD",
  locale?: string,
): ContextRow[] {
  const count = new Intl.NumberFormat(locale);
  const rows: ContextRow[] = [];
  for (const [key, label] of TOKEN_ROWS) {
    const value = usage?.[key];
    if (value !== undefined) rows.push({ label, value: count.format(value) });
  }
  if (cost !== undefined) {
    // Two significant digits where the currency's decimals would round a small cost to zero.
    const money = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumSignificantDigits: 2,
      roundingPriority: "morePrecision",
    });
    rows.push({ label: "Cost", value: money.format(cost) });
  }
  return rows;
}
