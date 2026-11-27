import type { TokenUsage, UsageLimit, UsageSlice } from "../../types/index.js";
import { type ResetOptions, resetWhen } from "../reset.js";
import { WORDS } from "../words.js";

/** One line of the details: what it counts, and its formatted value. */
export type ContextRow = { label: string; value: string };

/** How much of the window `used` takes, from 0 to 1. */
export const contextRatio = (used: number, total: number): number =>
  total > 0 ? Math.min(Math.max(used / total, 0), 1) : 0;

/** The counts, like "57,600 of 128,000 tokens", which the details show under the percentage the button shows. */
export function contextCountText(used: number, total: number, locale?: string): string {
  const count = new Intl.NumberFormat(locale);
  return `${count.format(used)} of ${count.format(total)} tokens`;
}

/** The meter's value for screen readers, like "57,600 of 128,000 tokens, 45%". */
export function contextValueText(used: number, total: number, locale?: string): string {
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  return `${contextCountText(used, total, locale)}, ${percent.format(contextRatio(used, total))}`;
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

const SLICE_COLORS = 6;
const percentFormat = (locale?: string) =>
  new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
const finite = (value: number) => (Number.isFinite(value) ? Math.max(value, 0) : 0);

/** One row of the breakdown, and its segment of the bar. */
export type ContextSlice = {
  /** The slice's `id`; `"free"` for Free space. */
  id: string;
  label: string;
  /** Its tokens, formatted, like "41,200". */
  value: string;
  /** Its share of the window, formatted, like "32%". */
  percent: string;
  /** Its segment's width in the bar, like "32.1875%": at least 1% while it holds any tokens. Empty for Free space. */
  width: string;
  /** Which category color it takes, 1 to 6, written as `data-color`; 0 for Free space, which is hollow. */
  color: number;
};

/** The breakdown's rows, Free space last, and the bar's name: "57% full: Messages 41,200, …, Free space 55,100". */
export type ContextBreakdown = { slices: ContextSlice[]; label: string };

/** The rows of `breakdown` against `total`, then Free space (`total` less `used`). Rows with 0 stay. */
export function contextBreakdown(
  breakdown: readonly UsageSlice[],
  used: number,
  total: number,
  fullText: string,
  locale?: string,
): ContextBreakdown {
  const count = new Intl.NumberFormat(locale);
  const percent = percentFormat(locale);
  let filled = 0;
  const slices = breakdown.map(({ id, label, value }, index): ContextSlice => {
    const share = total > 0 ? finite(value) / total : 0;
    const width = share > 0 ? Math.min(Math.max(share, 0.01), Math.max(1 - filled, 0)) : 0;
    filled += width;
    return {
      id,
      label,
      value: count.format(finite(value)),
      percent: percent.format(share),
      width: `${+(width * 100).toFixed(4)}%`,
      color: (index % SLICE_COLORS) + 1,
    };
  });
  const free = Math.max(total - used, 0);
  slices.push({
    id: "free",
    label: WORDS.freeSpace,
    value: count.format(free),
    percent: percent.format(total > 0 ? free / total : 0),
    width: "",
    color: 0,
  });
  return {
    slices,
    label: `${fullText}: ${slices.map((slice) => `${slice.label} ${slice.value}`).join(", ")}`,
  };
}

/** A usage limit as its row shows it. */
export type ContextLimitRow = {
  id: string;
  label: string;
  /** Its share used, like "62%". */
  percent: string;
  /** Pass it to UI SDK's Meter as its `value`. */
  value: number;
  /** Pass it to UI SDK's Meter as its `max`. */
  max: number;
  /** From 80% used: "Running low" leads its detail, and the row reads `data-level="high"`. */
  low: boolean;
  /** The line under its bar: "Running low · Resets Tue 9:00 AM · Ahead of pace". */
  detail: string;
  /** Pass it to UI SDK's Meter as its value label: "62% used, resets 5:00 PM". */
  valueText: string;
  /** How far through its window it is, from 0 to 1, for the pace tick; `undefined` without a window. */
  pace: number | undefined;
};

/** A limit's amount, like "1,240 of 2,000 requests" or "$20.50 of $50.00". */
export function limitAmount(limit: UsageLimit, locale?: string): string {
  const unit = limit.unit ?? "requests";
  if (unit === "currency") {
    const money = new Intl.NumberFormat(locale, { style: "currency", currency: limit.currency ?? "USD" });
    return `${money.format(finite(limit.used))} of ${money.format(finite(limit.total))}`;
  }
  const count = new Intl.NumberFormat(locale);
  return `${count.format(finite(limit.used))} of ${count.format(finite(limit.total))} ${unit}`;
}

/** The limits' rows. `amount` adds the amount to each detail, as an inline meter shows it. */
export function contextLimits(
  limits: readonly UsageLimit[],
  { now, locale, timeZone, amount = false }: ResetOptions & { amount?: boolean } = {},
): ContextLimitRow[] {
  const percent = percentFormat(locale);
  return limits.map((limit) => {
    const value = finite(limit.used);
    const max = finite(limit.total);
    const ratio = contextRatio(value, max);
    const low = Math.round(ratio * 100) >= 80;
    const when = resetWhen(limit.resetsAt, { now, locale, timeZone });
    const start = limit.windowStartedAt ? Date.parse(limit.windowStartedAt) : Number.NaN;
    const end = limit.resetsAt ? Date.parse(limit.resetsAt) : Number.NaN;
    const pace =
      now !== undefined && end > start ? Math.min(Math.max((now - start) / (end - start), 0), 1) : undefined;
    const used = percent.format(ratio);
    const detail = [
      low ? WORDS.runningLow : "",
      amount ? limitAmount(limit, locale) : "",
      when ? `${WORDS.resets} ${when}` : "",
      pace === undefined ? "" : ratio > pace + 0.05 ? WORDS.aheadOfPace : WORDS.onPace,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      id: limit.id,
      label: limit.label,
      percent: used,
      value,
      max,
      low,
      detail,
      valueText: when
        ? `${used} ${WORDS.used}, ${WORDS.resets.toLowerCase()} ${when}`
        : `${used} ${WORDS.used}`,
      pace,
    };
  });
}
