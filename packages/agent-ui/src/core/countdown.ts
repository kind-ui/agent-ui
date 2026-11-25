import { type PrimitiveContext, toLocale } from "@ui-sdk/core";
import { durationLabel } from "./time.js";

type CountdownContext<State> = Pick<PrimitiveContext<unknown, object, string>, "onDestroy"> & {
  store: { get(): State; set(state: Partial<State>): void; subscribe(listener: () => void): () => void };
};

export interface CountdownOptions<Key extends string, State> {
  /** The state key, which the component lists as `live`, that holds the whole seconds left. */
  key: Key;
  /** The ISO 8601 instant to count down to, read again on every store change; `undefined` while nothing counts. */
  at: () => string | undefined;
  /**
   * What `key` holds while nothing counts or `at` can't be read.
   * @default null
   */
  idle?: number | null;
  /** More state to write with each count, from the seconds left and the seconds the countdown started from. */
  with?: (seconds: number, from: number) => Partial<State>;
}

export interface Countdown {
  /** Starts counting, from a root slot's `bind`, so server markup and hydration hold `idle`. Returns the cleanup. */
  bind(): () => void;
}

/**
 * Whole seconds until an instant, in a `live` state key: one timer per instance, waking on each whole second, so a
 * tick renders only the parts that read the key. It stops at zero, and writes nothing until a root binds it.
 */
export function createCountdown<Key extends string, State extends Record<Key, number | null>>(
  context: CountdownContext<State>,
  { key, at, idle = null, with: extra }: CountdownOptions<Key, State>,
): Countdown {
  const { store } = context;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // What the timer counts to; `UNSET` until the root binds, so the first follow always writes.
  const UNSET = Symbol();
  let counting: string | undefined | typeof UNSET = UNSET;
  const write = (seconds: number | null, from: number) =>
    store.set({ [key]: seconds, ...extra?.(seconds ?? 0, from) } as Partial<State>);

  const count = (time: number, from?: number) => {
    const left = time - Date.now();
    const seconds = Math.max(0, Math.ceil(left / 1000));
    from ??= seconds;
    write(seconds, from);
    // Wakes on the next whole second, so the number changes when it should.
    if (left > 0) timer = setTimeout(count, left % 1000 || 1000, time, from);
  };

  const follow = () => {
    const target = at();
    if (target === counting) return;
    counting = target;
    clearTimeout(timer);
    const time = target ? Date.parse(target) : Number.NaN;
    if (Number.isNaN(time)) write(idle, 0);
    else count(time);
  };

  context.onDestroy(() => clearTimeout(timer));
  return {
    bind() {
      counting = UNSET;
      follow();
      const unsubscribe = store.subscribe(follow);
      return () => {
        unsubscribe();
        clearTimeout(timer);
      };
    },
  };
}

const DAY = 86400;

/**
 * A countdown's words, like "in 4 sec" or "in 1 min 12 sec", in `locale`'s short units, or whole days from a day on
 * ("in 3 days"). Empty at zero or below.
 */
export function countdownText(seconds: number | null, locale?: string): string {
  if (seconds === null || !(seconds > 0)) return "";
  if (seconds < DAY) return `in ${durationLabel(seconds, locale)}`;
  const days = new Intl.NumberFormat(toLocale(locale ?? "en") ?? "en", {
    style: "unit",
    unit: "day",
    unitDisplay: "long",
  });
  return `in ${days.format(Math.round(seconds / DAY))}`;
}
