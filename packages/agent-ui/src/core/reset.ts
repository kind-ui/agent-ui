import { toLocale } from "@ui-sdk/core";
import { dayKey } from "./time.js";

/** How a reset reads: `"short"` for a meter's line ("Tue 9:00 AM"), `"long"` for a sentence ("Tuesday at 9:00 AM"). */
export type ResetStyle = "short" | "long";

export interface ResetOptions {
  /** Now, in milliseconds. Without it, the date alone, as server markup shows it. */
  now?: number | undefined;
  locale?: string | undefined;
  /** An IANA time zone. Defaults to UTC; an invalid zone reads as UTC. */
  timeZone?: string | undefined;
  /** @default "short" */
  style?: ResetStyle;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const SPACES = /[\u2009\u202F]/g;

const format = (
  date: Date,
  tag: string,
  timeZone: string | undefined,
  options: Intl.DateTimeFormatOptions,
) => {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat(tag, { ...options, timeZone: timeZone ?? "UTC" });
  } catch {
    formatter = new Intl.DateTimeFormat(tag, { ...options, timeZone: "UTC" });
  }
  return formatter.format(date).replace(SPACES, " ");
};

const unit = (tag: string, name: "hour" | "minute", value: number) =>
  new Intl.NumberFormat(tag, { style: "unit", unit: name, unitDisplay: "short" }).format(value);

/** Time left in whole minutes, or whole hours from an hour on: "42 min", "3 hr". At least a minute. */
export function leftText(ms: number, locale?: string): string {
  const tag = toLocale(locale ?? "en") ?? "en";
  if (ms >= HOUR) return unit(tag, "hour", Math.round(ms / HOUR));
  return unit(tag, "minute", Math.max(1, Math.ceil(ms / 60_000)));
}

/**
 * When an ISO 8601 instant falls, in words (Wave 7 spec §2.3: resets read in minutes, an absolute date beyond a day):
 * the time today ("5:00 PM, in 3 hr" short, "5:00 PM" long), the weekday within a week ("Tue 9:00 AM", "Tuesday at
 * 9:00 AM"), else the date ("Dec 1"). Without `now`, the date. Empty for a string that isn't an instant.
 */
export function resetWhen(iso: string | undefined, options: ResetOptions = {}): string {
  const time = iso ? Date.parse(iso) : Number.NaN;
  if (Number.isNaN(time)) return "";
  const date = new Date(time);
  const tag = toLocale(options.locale ?? "en") ?? "en";
  const { now, timeZone, style = "short" } = options;
  const clock = () => format(date, tag, timeZone, { hour: "numeric", minute: "2-digit" });
  if (now !== undefined && time > now) {
    const left = time - now;
    if (dayKey(new Date(now).toISOString(), timeZone) === dayKey(date.toISOString(), timeZone))
      return style === "short" ? `${clock()}, in ${leftText(left, options.locale)}` : clock();
    if (left < 6 * DAY) {
      const weekday = format(date, tag, timeZone, { weekday: style === "short" ? "short" : "long" });
      return style === "short" ? `${weekday} ${clock()}` : `${weekday} at ${clock()}`;
    }
  }
  return format(date, tag, timeZone, { month: "short", day: "numeric" });
}

/** The page's time zone. Reads the browser: call it in a `bind`. */
export const localTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};
