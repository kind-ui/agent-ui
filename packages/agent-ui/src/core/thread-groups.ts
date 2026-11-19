import type { Thread } from "../types/index.js";
import { type DateGroupKey, dateGroup } from "./time.js";

export interface ThreadGroupOptions {
  /** Today: an ISO date (`todayKey(timeZone)`) or an instant. */
  now: string;
  /** A BCP 47 tag for the month, year and relative day names. Defaults to English. */
  locale?: string | undefined;
  /** The IANA time zone that decides a thread's day. Defaults to UTC. */
  timeZone?: string | undefined;
  /** Replaces the fixed groups' words, by key. */
  labels?: Partial<Record<DateGroupKey | "pinned", string>> | undefined;
}

export interface ThreadGroup {
  /** `"pinned"`, `"group:<name>"` for a host group, else a date group's key (`"today"`, `"2026-10"`, `"2025"`). */
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

/**
 * Threads in groups: pinned first, then the host's `group`s in first-seen order, then date groups from `updatedAt`,
 * newest first. Threads keep the host's order inside a group.
 */
export function threadGroups(threads: readonly Thread[], options: ThreadGroupOptions): ThreadGroup[] {
  const pinned: ThreadGroup = { key: "pinned", label: options.labels?.pinned ?? "Pinned", threads: [] };
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
