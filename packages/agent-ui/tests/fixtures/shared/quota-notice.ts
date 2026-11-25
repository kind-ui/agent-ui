/** A month's requests at 50%, resetting three days after `now`. */
export const quota = {
  used: 500,
  limit: 1000,
  period: "this month",
  resetAt: "2026-12-04T00:00:00Z",
  now: "2026-12-01T00:00:00Z",
};

/** Tokens used up, with no reset time and nothing to press. */
export const spent = { used: 200000, limit: 200000, unit: "tokens" };

/** The clock the `clock` case's page is installed at, and a reset five seconds after it. */
export const clock = { now: "2026-12-01T00:00:00Z", resetAt: "2026-12-01T00:00:05Z" };

/** Records each upgrade's source and each dismiss. */
export function quotaHost() {
  return { upgrades: [] as string[], dismisses: 0 };
}
