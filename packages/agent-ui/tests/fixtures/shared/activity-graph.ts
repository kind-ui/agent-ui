import type { ActivityDay } from "@kind-ui/agent-ui";
import { addDays } from "@ui-sdk/core/date";

/** The graph's last day: a Wednesday, so Thursday to Saturday of its week are in the future. */
export const activityNow = "2026-11-25";

// A year of runs: none on some days, and 12 on Tuesday, November 3.
export const activityDays: ActivityDay[] = Array.from({ length: 371 }, (_, index) => {
  const date = addDays(activityNow, -index);
  if (date === "2026-11-03") return { date, count: 12 };
  return { date, count: index % 5 === 0 || index % 7 === 3 ? 0 : ((index * 37) % 9) + 1 };
});

/** Records `onSelect` calls, which a test reads from `window.kindHost`. */
export function activityHost() {
  const selects: { date: string; reason: string; source: string }[] = [];
  const record = (date: string, details: { reason: string; source: string }) =>
    selects.push({ date, reason: details.reason, source: details.source });
  return { host: { selects }, record };
}
