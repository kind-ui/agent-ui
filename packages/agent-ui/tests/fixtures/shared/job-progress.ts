import type { JobProgressOptions } from "@kind-ui/agent-ui/core";

export const NOW = "2026-11-25T12:02:00.000Z";
const STARTED = "2026-11-25T12:00:00.000Z";

export const LOG = ["$ npm ci", "added 491 packages in 40s", "$ npm run build"];

export type JobId = "build" | "sync" | "deploy" | "export";

export type JobFixture = {
  id: JobId;
  options: JobProgressOptions;
  /** Whether the host listens for Cancel or Retry. */
  cancel?: boolean;
  retry?: boolean;
  /** Whether the job's log is its content. */
  log?: boolean;
};

export const jobs: JobFixture[] = [
  {
    id: "build",
    options: {
      label: "Build docs",
      status: "running",
      value: 0.42,
      stage: "Installing dependencies",
      stageIndex: 2,
      stageCount: 7,
      startedAt: STARTED,
      etaSeconds: 60,
      now: NOW,
    },
    cancel: true,
    log: true,
  },
  { id: "sync", options: { label: "Sync search index", status: "running", startedAt: STARTED, now: NOW } },
  {
    id: "deploy",
    options: {
      label: "Deploy preview",
      status: "error",
      value: 0.6,
      stage: "Uploading assets",
      stageIndex: 3,
      stageCount: 5,
      durationSeconds: 95,
    },
    retry: true,
  },
  { id: "export", options: { label: "Export data", status: "complete", durationSeconds: 190 } },
];

/** A job started a few seconds before the page loaded, with no `now`, so its elapsed time ticks. */
export const clockJob = (): JobProgressOptions => ({
  label: "Reindex",
  status: "running",
  startedAt: new Date(Date.now() - 3000).toISOString(),
});

export type JobHost = {
  calls: { cancel: number; retry: number };
  /** Settles the pending call. */
  resolve(): void;
  reject(): void;
  set(id: JobId, options: Partial<JobProgressOptions>): void;
};

/** Counts each Cancel and Retry, and keeps the newest pending until `resolve` or `reject`. */
export function jobHost() {
  let settle = { resolve: () => {}, reject: () => {} };
  const host = {
    calls: { cancel: 0, retry: 0 },
    resolve: () => settle.resolve(),
    reject: () => settle.reject(),
  };
  const call = (kind: "cancel" | "retry") => () => {
    host.calls[kind]++;
    return new Promise<void>((resolve, reject) => {
      settle = { resolve, reject };
    });
  };
  return { host, call };
}
