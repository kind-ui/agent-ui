import type { PrimitiveContext } from "@ui-sdk/core";
import { durationLabel } from "./time.js";

type CountdownContext<State> = Pick<PrimitiveContext<unknown, object, string>, "onDestroy"> & {
  store: { get(): State; set(state: Partial<State>): void; subscribe(listener: () => void): () => void };
};

export interface CountdownOptions<Key extends string> {
  /** The state key, which the component lists as `live`, that holds the seconds left, `null` while nothing counts. */
  key: Key;
  /** The ISO 8601 instant to count down to, read again on every store change; `undefined` while nothing counts. */
  at: () => string | undefined;
  /**
   * Counts whole minutes while a minute or more is left, waking once a minute, then whole seconds (Wave 7 spec
   * §2.3: countdowns tick in seconds only under a minute).
   * @default false
   */
  minutes?: boolean;
}

export interface Countdown {
  /** Starts counting, from a root slot's `bind`, so server markup and hydration hold `null`. Returns the cleanup. */
  bind(): () => void;
}

const MINUTE = 60_000;

/**
 * The seconds left until an instant, in a `live` state key: one timer per instance, waking when the shown value
 * changes, so a tick renders only the parts that read the key. It stops at zero, and writes nothing until a root
 * binds it.
 */
export function createCountdown<Key extends string, State extends Record<Key, number | null>>(
  context: CountdownContext<State>,
  { key, at, minutes = false }: CountdownOptions<Key>,
): Countdown {
  const { store } = context;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let counting: string | undefined | null = null;
  const write = (seconds: number | null) => {
    if (store.get()[key] !== seconds) store.set({ [key]: seconds } as Partial<State>);
  };

  const count = (time: number) => {
    const left = time - Date.now();
    if (minutes && left > MINUTE) {
      write(Math.floor(left / MINUTE) * 60);
      timer = setTimeout(count, left % MINUTE || MINUTE, time);
      return;
    }
    write(Math.max(0, Math.ceil(left / 1000)));
    if (left > 0) timer = setTimeout(count, left % 1000 || 1000, time);
  };

  const follow = () => {
    const target = at();
    if (target === counting) return;
    counting = target;
    clearTimeout(timer);
    const time = target ? Date.parse(target) : Number.NaN;
    if (Number.isNaN(time)) write(null);
    else count(time);
  };

  context.onDestroy(() => clearTimeout(timer));
  return {
    bind() {
      counting = null;
      follow();
      const unsubscribe = store.subscribe(follow);
      return () => {
        unsubscribe();
        clearTimeout(timer);
      };
    },
  };
}

/** A countdown's words, like "in 4 min" or "in 40 sec", in `locale`'s short units. Empty at zero, below or without one. */
export function countdownText(seconds: number | null, locale?: string): string {
  return seconds !== null && seconds > 0 ? `in ${durationLabel(seconds, locale)}` : "";
}
