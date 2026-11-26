import type { RunEvent } from "@kind-ui/agent-ui";

const ada = { id: "ada", name: "Ada" };

/** A run's events, oldest first, on 2026-11-10 in UTC; the newest is still running. */
export const events: RunEvent[] = [
  {
    id: "started",
    at: "2026-11-10T14:02:00Z",
    title: "Run started",
    status: "complete",
    actor: ada,
    description: "Fix the login redirect on **main**.",
  },
  {
    id: "approved",
    at: "2026-11-10T14:05:00Z",
    title: "Ada approved npm test",
    status: "complete",
    actor: ada,
  },
  {
    id: "tests",
    at: "2026-11-10T14:09:00Z",
    title: "Ran the tests",
    status: "error",
    description: "2 of 312 tests failed in `auth.test.ts`.",
  },
  { id: "note", at: "2026-11-10T14:11:00Z", title: "Retrying with a fix" },
  { id: "checks", at: "2026-11-10T14:20:00Z", title: "Running checks", status: "running" },
];

/** An event earlier than every other, as Show earlier loads. */
export const earlier: RunEvent = {
  id: "queued",
  at: "2026-11-09T22:40:00Z",
  title: "Run queued",
  status: "complete",
};

/** The next event, as a run appends one. */
export const next: RunEvent = {
  id: "pr",
  at: "2026-11-10T14:31:00Z",
  title: "Pull request opened",
  status: "complete",
  description: "#482 Fix the login redirect",
};

/** The running event finished, then the next one arrives. */
export const appended = (current: RunEvent[]): RunEvent[] => [
  ...current.map((event) => (event.status === "running" ? { ...event, status: "complete" as const } : event)),
  next,
];
