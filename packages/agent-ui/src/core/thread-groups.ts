import type { Thread } from "../types/index.js";
import { type DateGroupKey, dateGroup } from "./time.js";
import { WORDS } from "./words.js";

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
  "needs-you": WORDS.needsYou,
  running: "Running",
  done: "Done",
};

const time = (iso: string | undefined) => {
  const value = iso === undefined ? Number.NaN : Date.parse(iso);
  return Number.isNaN(value) ? undefined : value;
};

/**
 * "Needs you" holds threads waiting on an approval or an answer, and failures not yet seen; "Running" running and
 * queued ones; "Done" the rest.
 */
export const statusGroup = (thread: Thread): ThreadStatusGroupKey => {
  const { status } = thread;
  if (status === "awaiting-approval" || status === "awaiting-input") return "needs-you";
  if (status === "error" && thread.unread) return "needs-you";
  if (status === "running" || status === "queued") return "running";
  return "done";
};

// Oldest first, threads without a time last.
const ascending = (a: number | undefined, b: number | undefined) =>
  (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY) || 0;
// Newest first, threads without a time last.
const descending = (a: number | undefined, b: number | undefined) =>
  (b ?? Number.NEGATIVE_INFINITY) - (a ?? Number.NEGATIVE_INFINITY) || 0;

const waited = (thread: Thread) => time(thread.waitingSince) ?? time(thread.updatedAt);

// `sort` is stable, so threads that tie keep the host's order.
const ORDER: Record<ThreadStatusGroupKey, (a: Thread, b: Thread) => number> = {
  "needs-you": (a, b) => ascending(waited(a), waited(b)),
  running: (a, b) =>
    Number(a.status === "queued") - Number(b.status === "queued") ||
    descending(time(a.updatedAt), time(b.updatedAt)),
  done: (a, b) => descending(time(a.updatedAt), time(b.updatedAt)),
};

const byStatus = (threads: readonly Thread[], options: ThreadGroupOptions): ThreadGroup[] => {
  const groups = new Map<ThreadStatusGroupKey, Thread[]>([
    ["needs-you", []],
    ["running", []],
    ["done", []],
  ]);
  for (const thread of threads) groups.get(statusGroup(thread))?.push(thread);
  return [...groups].flatMap(([key, list]) =>
    list.length
      ? [{ key, label: options.labels?.[key] ?? STATUS_LABELS[key], threads: list.sort(ORDER[key]) }]
      : [],
  );
};

/**
 * Threads in groups: pinned first, then the host's `group`s in first-seen order, then date groups from `updatedAt`,
 * newest first. Threads keep the host's order inside a group. With `groupBy: "status"`, pinned first, then "Needs
 * you" (oldest waiting first), "Running" (newest first, queued last) and "Done" (newest first); the host's `group`s
 * don't apply.
 */
export function threadGroups(threads: readonly Thread[], options: ThreadGroupOptions): ThreadGroup[] {
  const pinned: ThreadGroup = { key: "pinned", label: options.labels?.pinned ?? "Pinned", threads: [] };
  if (options.groupBy === "status") {
    pinned.threads = threads.filter((thread) => thread.pinned);
    const rest = byStatus(
      threads.filter((thread) => !thread.pinned),
      options,
    );
    return pinned.threads.length ? [pinned, ...rest] : rest;
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
