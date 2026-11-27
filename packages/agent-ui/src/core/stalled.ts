import { announce } from "@ui-sdk/core";
import { durationLabel } from "./time.js";
import { everyMinute } from "./today.js";
import { WORDS } from "./words.js";

export type StalledOptions = {
  /** When the last update arrived, as an ISO 8601 date-time. With it, a running state reads "No update for 2 min". */
  lastActivityAt?: string;
  /**
   * Seconds without an update before a running state counts as stalled.
   * @default 120
   */
  stalledAfter?: number;
};

export type StalledState = {
  /** Whether nothing has arrived for `stalledAfter` while running. Read on the browser's clock, so never on a server. */
  stalled: boolean;
  /** Whole minutes since the last update while stalled, else `null`. */
  stalledMinutes: number | null;
};

/** The stalled options, for a primitive's `options` map. */
export const STALLED_OPTIONS = { lastActivityAt: "string", stalledAfter: "number" } as const;
/** The state before a root binds, as on a server: not stalled. */
export const NOT_STALLED: StalledState = { stalled: false, stalledMinutes: null };

/** Whole minutes since `lastActivityAt` once `after` seconds have passed at `now`, else `null`. */
export function stalledFor(lastActivityAt: string | undefined, now: number, after = 120): number | null {
  const last = lastActivityAt ? Date.parse(lastActivityAt) : Number.NaN;
  if (Number.isNaN(last)) return null;
  const seconds = (now - last) / 1000;
  return seconds >= after ? Math.max(1, Math.floor(seconds / 60)) : null;
}

/** "No update for 2 min", or an empty string while not stalled. */
export const stalledText = (minutes: number | null, locale?: string): string =>
  minutes === null ? "" : `${WORDS.noUpdateFor} ${durationLabel(minutes * 60, locale)}`;

type StalledStore = { get(): StalledState; set(state: StalledState): void };

type StalledInput = {
  running: boolean;
  lastActivityAt?: string | undefined;
  stalledAfter?: number | undefined;
  locale?: string | undefined;
};

/**
 * Follows `lastActivityAt` on Wave 6's one-minute clock while `running()`, writing `stalled` and `stalledMinutes`,
 * and announces "No update for 2 min" once as it starts and "Working again" as it ends. Bound from a root's `bind`,
 * so server markup is never stalled; a component calls `check` with its new options as they change.
 */
export function watchStalled(store: StalledStore, read: () => StalledInput) {
  let bound = false;
  // Web hosts set `lastActivityAt` once the element exists, so a row stalled from the start stays quiet.
  let started = false;
  /** Reads again, from `input` when given, like the new options an `onOptions` listener gets. */
  const check = (input: StalledInput = read()) => {
    if (!bound) return;
    const { running, lastActivityAt, stalledAfter, locale } = input;
    const minutes = running ? stalledFor(lastActivityAt, Date.now(), stalledAfter ?? 120) : null;
    const { stalled, stalledMinutes } = store.get();
    if (minutes === stalledMinutes) return;
    store.set({ stalled: minutes !== null, stalledMinutes: minutes });
    if (!started) return;
    if (minutes !== null && !stalled) announce(stalledText(minutes, locale), { priority: "polite" });
    else if (minutes === null && running) announce(WORDS.workingAgain, { priority: "polite" });
  };
  return {
    check,
    /** Starts following, quietly for a state already stalled as it binds. Returns the cleanup. */
    bind: () => {
      const { running, lastActivityAt, stalledAfter } = read();
      const minutes = running ? stalledFor(lastActivityAt, Date.now(), stalledAfter ?? 120) : null;
      if (minutes !== store.get().stalledMinutes)
        store.set({ stalled: minutes !== null, stalledMinutes: minutes });
      bound = true;
      const frame = requestAnimationFrame(() => {
        started = true;
      });
      const stop = everyMinute(() => check());
      return () => {
        bound = false;
        started = false;
        cancelAnimationFrame(frame);
        stop();
      };
    },
  };
}
