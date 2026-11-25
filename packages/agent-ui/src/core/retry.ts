import { announce, type PrimitiveContext, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { RetryState } from "../types/index.js";
import { type Countdown, countdownText, createCountdown } from "./countdown.js";

/** The words of a retry: "Retrying, attempt 2 of 5, in 4 sec. Rate limited". */
export function retryText(retry: RetryState, seconds: number | null, locale?: string): string {
  const of = retry.maxAttempts ? ` of ${retry.maxAttempts}` : "";
  const when = countdownText(seconds, locale);
  return `Retrying, attempt ${retry.attempt}${of}${when ? `, ${when}` : ""}${retry.reason ? `. ${retry.reason}` : ""}`;
}

/** What a retry announces once, when its attempt starts: "Retrying, attempt 2". Never the countdown. */
export const retryAnnouncement = (retry: RetryState): string => `Retrying, attempt ${retry.attempt}`;

/** What a component that spreads the retry part keeps in its state, beside its countdown key. */
export type RetryPartState = {
  /** The retry in progress, if any. */
  retry: RetryState | undefined;
};

export type RetryPartConfig<Options, Key extends string> = {
  /** The retry the options describe, like a message's `retry`. */
  retry: (options: Options) => RetryState | undefined;
  /** The `live` state key the countdown to `retryAt` writes: whole seconds, `null` while nothing counts. */
  countdownKey: Key;
};

type HostState<Key extends string> = RetryPartState & Record<Key, number | null>;

/**
 * A retry in progress (spec §3.2), which Message and Tool spread: its state, the countdown and announcement that
 * `onOptions` starts in the component's api, and the `retry` slot that shows it. The slot's words tick once a second
 * through the live countdown key and are never announced; the attempt is announced once, when it changes.
 */
export const retryPart = <Options, Key extends string>({
  retry,
  countdownKey,
}: RetryPartConfig<Options, Key>) => ({
  /** The state from the options, with the countdown at `null` until a root binds it. */
  state: (options: Options) => ({ retry: retry(options), [countdownKey]: null }) as HostState<Key>,
  /** The state the options change: the countdown keeps counting. */
  sync: (options: Options): RetryPartState => ({ retry: retry(options) }),
  live: [countdownKey] as Key[],
  /**
   * Announces each attempt the instance sees start, not one it mounted with, and returns the countdown to
   * `retryAt`, for the component's root slot to bind.
   */
  onOptions: <State extends HostState<Key>>(
    context: Pick<PrimitiveContext<Options, State, string>, "store" | "onOptions" | "onDestroy">,
  ): Countdown => {
    let attempt = context.store.get().retry?.attempt;
    context.onOptions((options) => {
      const next = retry(options);
      if (next?.attempt === attempt) return;
      attempt = next?.attempt;
      if (next) announce(retryAnnouncement(next), { priority: "polite" });
    });
    return createCountdown<Key, State>(context, {
      key: countdownKey,
      at: () => context.store.get().retry?.retryAt,
    });
  },
  /**
   * The `retry` slot: present while retrying, with its words in `text`, the countdown's units in `locale` (like the
   * component's own). The layers draw a running status mark before them.
   */
  slot: <State extends HostState<Key>, Api>(
    locale?: (state: State) => string | undefined,
  ): SlotDefinition<State, Api, BaseSlotProps, { text: string }> => ({
    present: (state) => state.retry !== undefined,
    state: (state) => ({
      text: state.retry ? retryText(state.retry, state[countdownKey], locale?.(state)) : "",
    }),
    attrs: () => ({ "data-retry-part": "retry" }),
  }),
});
