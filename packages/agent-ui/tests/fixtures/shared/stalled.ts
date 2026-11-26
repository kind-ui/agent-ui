/** An ISO instant `seconds` before the page loaded. */
export const ago = (seconds: number): string => new Date(Date.now() - seconds * 1000).toISOString();

/** The stalled page: a running step that's fine, one with no update for 2 min, a Status and a Thinking Indicator. */
export const stalled = {
  running: { title: "Searching the docs", meta: "48 sec", lastActivityAt: ago(10) },
  stalled: { title: "Searching the docs", meta: "3 min", lastActivityAt: ago(150) },
  status: { label: "Deploying to staging", lastActivityAt: ago(330) },
  indicator: { lastActivityAt: ago(130) },
};
