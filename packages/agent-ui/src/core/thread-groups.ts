import type { Thread } from "../types/index.js";
import { type DateGroupKey, dateGroup } from "./time.js";

export interface ThreadGroupOptions {
  /** Today: an ISO date (`todayKey(timeZone)`) or an instant. */
  now: string;
  /** A BCP 47 tag for the month, year and relative day names. Defaults to English. */
  locale?: string | undefined;
  /** The IANA time zone that decides a thread's day. Defaults to UTC. */
  timeZone?: string | undefined;
  /**
   * `"date"` groups by the host's `group`, then by day. `"status"` groups by what a thread needs from the person:
   * "Needs you", "Running", then "Done".
   * @default "date"
   */
  groupBy?: "date" | "status" | undefined;
  /** Replaces the fixed groups' words, by key. */
  labels?: Partial<Record<DateGroupKey | ThreadStatusGroupKey | "pinned", string>> | undefined;
}

/** The groups of `groupBy: "status"`, in order. */
export type ThreadStatusGroupKey = "needs-you" | "running" | "done";

export interface ThreadGroup {
  /**
   * `"pinned"`, `"group:<name>"` for a host group, a date group's key (`"today"`, `"2026-10"`, `"2025"`), or with
   * `groupBy: "status"` a `ThreadStatusGroupKey`.
   */
  key: string;
  label: string;
  threads: Thread[];
}

const FIXED: string[] = ["today", "yesterday", "previous-7-days", "previous-30-days"];

/** Fixed groups in order, then months, then years, then `older`. */
const rank = (key: string) => {
  const fixed = FIXED.indexOf(key);
  if (fixed >= 0) return fixed;
  if (key === "older") return FIXED.length + 2;
  return FIXED.length + (key.length === 7 ? 0 : 1);
};

const byRecency = (a: ThreadGroup, b: ThreadGroup) =>
  rank(a.key) - rank(b.key) || (a.key < b.key ? 1 : a.key > b.key ? -1 : 0);

const STATUS_LABELS: Record<ThreadStatusGroupKey, string> = {
  "needs-you": "Needs you",
  running: "Running",
  done: "Done",
};

// Within "Needs you", a thread that's waiting or failed comes before a finished one the person hasn't read.
const statusGroup = (thread: Thread): { key: ThreadStatusGroupKey; rank: number } => {
  const { status } = thread;
  if (status === "awaiting-input" || status === "error") return { key: "needs-you", rank: 0 };
  if (status === "complete" && thread.unread) return { key: "needs-you", rank: 1 };
  if (status === "running" || status === "queued") return { key: "running", rank: 0 };
  return { key: "done", rank: 0 };
};

const updated = (thread: Thread) => {
  const time = thread.updatedAt === undefined ? Number.NaN : Date.parse(thread.updatedAt);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
};

const byStatus = (threads: readonly Thread[], options: ThreadGroupOptions): ThreadGroup[] => {
  const ranked = new Map<ThreadStatusGroupKey, { thread: Thread; rank: number }[]>([
    ["needs-you", []],
    ["running", []],
    ["done", []],
  ]);
  for (const thread of threads) {
    const { key, rank } = statusGroup(thread);
    ranked.get(key)?.push({ thread, rank });
  }
  // `sort` is stable, so threads of one rank keep the host's order.
  ranked.get("needs-you")?.sort((a, b) => a.rank - b.rank);
  ranked.get("done")?.sort((a, b) => updated(b.thread) - updated(a.thread));
  return [...ranked].flatMap(([key, entries]) =>
    entries.length
      ? [{ key, label: options.labels?.[key] ?? STATUS_LABELS[key], threads: entries.map((entry) => entry.thread) }]
      : [],
  );
};

/**
 * Threads in groups: pinned first, then the host's `group`s in first-seen order, then date groups from `updatedAt`,
 * newest first. Threads keep the host's order inside a group. With `groupBy: "status"`, pinned first, then "Needs
 * you" (waiting or failed, then finished and unread), "Running" (running or queued) and "Done" (the rest, newest
 * first); the host's `group`s don't apply.
 */
export function threadGroups(threads: readonly Thread[], options: ThreadGroupOptions): ThreadGroup[] {
  const pinned: ThreadGroup = { key: "pinned", label: options.labels?.pinned ?? "Pinned", threads: [] };
  if (options.groupBy === "status") {
    const rest = threads.filter((thread) => !thread.pinned);
    pinned.threads = threads.filter((thread) => thread.pinned);
    return [...(pinned.threads.length ? [pinned] : []), ...byStatus(rest, options)];
  }
  const hosts = new Map<string, ThreadGroup>();
  const dates = new Map<string, ThreadGroup>();
  const add = (groups: Map<string, ThreadGroup>, key: string, label: string, thread: Thread) => {
    let group = groups.get(key);
    if (!group) {
      group = { key, label, threads: [] };
      groups.set(key, group);
    }
    group.threads.push(thread);
  };
  for (const thread of threads) {
    if (thread.pinned) pinned.threads.push(thread);
    else if (thread.group) add(hosts, `group:${thread.group}`, thread.group, thread);
    else {
      const { key, label } = dateGroup(thread.updatedAt, options);
      add(dates, key, label, thread);
    }
  }
  return [
    ...(pinned.threads.length ? [pinned] : []),
    ...hosts.values(),
    ...[...dates.values()].sort(byRecency),
  ];
}
