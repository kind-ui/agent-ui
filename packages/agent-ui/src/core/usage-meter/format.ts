/** What a Usage Meter counts. */
export type UsageUnit = "tokens" | "requests" | "currency";

/** An amount in `unit`, like "$3.20", "57,600 tokens" or "120 requests"; `bare` leaves the word out. */
export function usageAmount(
  value: number,
  unit: UsageUnit,
  currency: string,
  locale?: string,
  bare = false,
): string {
  if (unit === "currency")
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  const count = new Intl.NumberFormat(locale).format(value);
  return bare ? count : `${count} ${unit}`;
}

/** The amounts, like "$3.20 of $5.00" or "120 of 500 requests". */
export function usageCountText(
  used: number,
  limit: number,
  unit: UsageUnit,
  currency: string,
  locale?: string,
): string {
  return `${usageAmount(used, unit, currency, locale, true)} of ${usageAmount(limit, unit, currency, locale)}`;
}

/** How much of the limit `used` takes, from 0 to 1. */
export const usageRatio = (used: number, limit: number): number =>
  limit > 0 ? Math.min(Math.max(used / limit, 0), 1) : 0;

/** The trigger's name, like "Usage, $3.20 of $5.00, 64%". */
export function usageValueText(
  label: string,
  used: number,
  limit: number,
  unit: UsageUnit,
  currency: string,
  locale?: string,
): string {
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  return `${label}, ${usageCountText(used, limit, unit, currency, locale)}, ${percent.format(usageRatio(used, limit))}`;
}
