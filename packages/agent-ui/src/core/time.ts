import { toLocale } from "@ui-sdk/core";
import { dateParts, daysBetween, formatDate } from "@ui-sdk/core/date";
import type { Message } from "../types/index.js";

/** Where and in which language a date reads. Both default to English and UTC, so a server and a browser agree. */
export interface TimeOptions {
  locale?: string | undefined;
  timeZone?: string | undefined;
}

/**
 * `now` is today: an ISO date (`todayDate(timeZone)` from `@ui-sdk/core/date`, read in a `bind`) or an instant.
 * Leave it out for the absolute date, as server markup shows it.
 */
export interface RelativeTimeOptions extends TimeOptions {
  now?: string | undefined;
}

/** The fixed date groups' keys, which `labels` can rename. */
export type DateGroupKey = "today" | "yesterday" | "previous-7-days" | "previous-30-days" | "older";

export interface DateGroupOptions extends RelativeTimeOptions {
  now: string;
  labels?: Partial<Record<DateGroupKey, string>> | undefined;
}

/** A date group: a fixed key, a month this year (`"2026-10"`) or a year (`"2025"`). */
export interface DateGroup {
  key: string;
  label: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const locale = (tag: string | undefined): string => toLocale(tag ?? "en") ?? "en";

const formatters = new Map<string, Intl.DateTimeFormat>();
const formatter = (tag: string, timeZone: string | undefined, options: Intl.DateTimeFormatOptions) => {
  const key = `${tag}|${timeZone ?? ""}|${JSON.stringify(options)}`;
  let found = formatters.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(tag, { ...options, timeZone: timeZone ?? "UTC" });
    } catch {
      found = new Intl.DateTimeFormat(tag, { ...options, timeZone: "UTC" });
    }
    formatters.set(key, found);
  }
  return found;
};

const relative = new Map<string, Intl.RelativeTimeFormat>();
const relativeDay = (tag: string, days: number) => {
  let found = relative.get(tag);
  if (!found) {
    found = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
    relative.set(tag, found);
  }
  return found.format(-days, "day");
};

const instant = (iso: string): Date | undefined => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/** The calendar day `iso` falls on in `timeZone` (default UTC), as `YYYY-MM-DD`; an ISO date is its own day. */
export function dayKey(iso: string, timeZone?: string): string | undefined {
  if (ISO_DATE.test(iso)) return dateParts(iso) ? iso : undefined;
  const date = instant(iso);
  if (!date) return undefined;
  const parts = formatter("en-US-u-ca-gregory-nu-latn", timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year").padStart(4, "0")}-${read("month")}-${read("day")}`;
}

export function isSameDay(a: string, b: string, timeZone?: string): boolean {
  const day = dayKey(a, timeZone);
  return day !== undefined && day === dayKey(b, timeZone);
}

const daysAgo = (iso: string, now: string | undefined, timeZone: string | undefined) => {
  const day = dayKey(iso, timeZone);
  const today = now === undefined ? undefined : dayKey(now, timeZone);
  if (day === undefined) return undefined;
  return { day, today, ago: today === undefined ? undefined : daysBetween(day, today) };
};

/**
 * A day as words: "today", "yesterday" (in `Intl`'s case, which CSS capitalizes), a weekday within 6 days, else the
 * date. Without `now`, the date. Empty for a string that isn't a date.
 */
export function dayLabel(iso: string, options: RelativeTimeOptions = {}): string {
  const found = daysAgo(iso, options.now, options.timeZone);
  if (!found) return "";
  const tag = locale(options.locale);
  const { day, ago } = found;
  if (ago === 0 || ago === 1) return relativeDay(tag, ago);
  if (ago !== undefined && ago > 1 && ago < 7) return formatDate(day, tag, { weekday: "long" });
  return formatDate(day, tag, { year: "numeric", month: "long", day: "numeric" });
}

/** The time of day `iso` reads in `timeZone`, with the date when it isn't `now`'s day (and the year when not its year). */
export function timeLabel(iso: string, options: RelativeTimeOptions = {}): string {
  const date = instant(iso);
  const found = daysAgo(iso, options.now, options.timeZone);
  if (!date || !found) return "";
  const format: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  if (found.ago !== 0) {
    format.month = "short";
    format.day = "numeric";
    if (found.today?.slice(0, 4) !== found.day.slice(0, 4)) format.year = "numeric";
  }
  return formatter(locale(options.locale), options.timeZone, format).format(date);
}

const unitFormats = new Map<string, Intl.NumberFormat>();
const unit = (tag: string, name: "hour" | "minute" | "second", value: number) => {
  const key = `${tag}|${name}`;
  let found = unitFormats.get(key);
  if (!found) {
    found = new Intl.NumberFormat(tag, { style: "unit", unit: name, unitDisplay: "short" });
    unitFormats.set(key, found);
  }
  return found.format(value);
};

/** A duration in whole seconds, at least 1, in `locale`'s short units: "4 sec", "1 min 12 sec". Empty while unknown. */
export function durationLabel(seconds: number | undefined, localeTag?: string): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return "";
  const tag = locale(localeTag);
  const total = Math.max(1, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const parts: string[] = [];
  if (hours) parts.push(unit(tag, "hour", hours));
  if (minutes) parts.push(unit(tag, "minute", minutes));
  if (rest) parts.push(unit(tag, "second", rest));
  return parts.join(" ");
}

/**
 * Whether `next` follows `previous` from the same author within `withinMinutes` (default 5), so it can leave out its
 * author. Both need an `author` and a `createdAt`.
 */
export function isContinuation(
  previous: Pick<Message, "author" | "createdAt"> | undefined,
  next: Pick<Message, "author" | "createdAt">,
  { withinMinutes = 5 }: { withinMinutes?: number } = {},
): boolean {
  if (!previous?.author || !next.author || previous.author.id !== next.author.id) return false;
  const from = previous.createdAt === undefined ? undefined : instant(previous.createdAt);
  const to = next.createdAt === undefined ? undefined : instant(next.createdAt);
  if (!from || !to) return false;
  const gap = to.getTime() - from.getTime();
  return gap >= 0 && gap <= withinMinutes * 60_000;
}

const GROUP_LABELS: Record<Exclude<DateGroupKey, "today" | "yesterday">, string> = {
  "previous-7-days": "Previous 7 days",
  "previous-30-days": "Previous 30 days",
  older: "Older",
};

/**
 * The group a date falls in, from `now`: today, yesterday, the previous 7 days, the previous 30 days, then its month
 * this year, then its year. A string that isn't a date is `older`. A date after `now` counts as today.
 */
export function dateGroup(iso: string | undefined, options: DateGroupOptions): DateGroup {
  const tag = locale(options.locale);
  const named = (key: DateGroupKey, fallback: () => string): DateGroup => ({
    key,
    label: options.labels?.[key] ?? fallback(),
  });
  const found = iso === undefined ? undefined : daysAgo(iso, options.now, options.timeZone);
  if (found?.ago === undefined || found.today === undefined) return named("older", () => GROUP_LABELS.older);
  const { day, today, ago } = found;
  if (ago <= 0) return named("today", () => relativeDay(tag, 0));
  if (ago === 1) return named("yesterday", () => relativeDay(tag, 1));
  if (ago <= 7) return named("previous-7-days", () => GROUP_LABELS["previous-7-days"]);
  if (ago <= 30) return named("previous-30-days", () => GROUP_LABELS["previous-30-days"]);
  const first = `${day.slice(0, 7)}-01`;
  if (day.slice(0, 4) === today.slice(0, 4)) {
    return { key: day.slice(0, 7), label: formatDate(first, tag, { month: "long" }) };
  }
  return { key: day.slice(0, 4), label: formatDate(first, tag, { year: "numeric" }) };
}
