import {
  type ActionDetails,
  animateIn,
  animateOut,
  announce,
  createFocusRecovery,
  type FocusRecovery,
  prepareAnnouncements,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { actionSource } from "../action-source.js";
import { definePrimitive } from "../define-primitive.js";
import type { MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { nearestTabStop } from "../tab-stop.js";

/** Where the app's connection to its server stands. */
export type ConnectionState = "online" | "connecting" | "reconnecting" | "offline";

/** What the pill shows: a connection state, or `"resuming"` while a stream picks up after a reconnect. */
export type ConnectionPhase = ConnectionState | "resuming";

/** The words Connection Status shows and announces. */
export type ConnectionStatusLabels = {
  connecting: string;
  reconnecting: string;
  offline: string;
  resuming: string;
  retry: string;
  /** The countdown to the next try while reconnecting. */
  countdown: (seconds: number) => string;
  /** Announced when the connection drops, for `reconnecting` or `offline`. */
  lost: string;
  /** Announced when it's `online` again. */
  restored: string;
};

/** Who pressed Retry, and how: Retry's own button, or a call to the api or an agent's. */
export type ConnectionStatusRetryDetails = ActionDetails & { reason: "retry-press" | "imperative" };

export type ConnectionStatusOptions = {
  /**
   * Where the connection stands. The pill shows while it isn't `online`, and fades out when it turns `online`.
   * @default "online"
   */
  state?: ConnectionState;
  /**
   * Whether a stream is picking up after a reconnect. Shows "Resuming", without Retry, while `state` is `online`.
   * @default false
   */
  resuming?: boolean;
  /**
   * When the next try starts (ISO 8601). While `reconnecting`, the pill counts down to it, and shows "Reconnecting"
   * once it's past or when it can't be read.
   */
  retryAt?: string;
  /**
   * Called when Retry is pressed. Shows Retry while set and the connection is down (not `online` or resuming).
   * Return a promise to show "Reconnecting", without Retry, until it settles; a rejection or a throw offers Retry
   * again, and so does the next outage.
   */
  onRetry?: (details: ConnectionStatusRetryDetails) => unknown;
  /** The words to show and announce, for another language or tone. Each one left out keeps its English default. */
  labels?: Partial<ConnectionStatusLabels>;
  /**
   * How the pill comes and goes: at full motion it drops in and fades out, a 120 ms fade with reduced motion, at once
   * with `"none"`. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ConnectionStatusState = {
  /** The phase from `state` and `resuming`. */
  phase: ConnectionPhase;
  /** The last phase other than `online`, which the pill keeps showing as it leaves. */
  shown: Exclude<ConnectionPhase, "online">;
  /** Whether the pill shows: false once `online` and its exit has ended. */
  present: boolean;
  /** Whether the root has had its first frame. Changes before then aren't news. */
  started: boolean;
  /** Whole seconds until `retryAt` while `reconnecting`, else 0. Live: only the text hears it. */
  seconds: number;
  /** How many digits `seconds` has lost since its countdown started, which the default words keep room for. Live. */
  spareDigits: number;
  /** The `retryAt` option. */
  retryAt: string | undefined;
  /** Whether `onRetry` is set. */
  canRetry: boolean;
  /** Whether a promise `onRetry` returned is still pending. Agents wait on it. */
  pending: boolean;
  /** The words, with the defaults filled in. */
  labels: ConnectionStatusLabels;
  /** The `motion` option. */
  motion: MotionMode;
};

export type ConnectionStatusApi = {
  /** Calls `onRetry`, as Retry does. Offered while `onRetry` is set, the connection is down and no retry is pending. */
  readonly retry: ((event?: Event) => void) | undefined;
  /** Internal: moves focus on when Retry leaves while focused. Called by the retry slot. */
  recovery: FocusRecovery;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  ConnectionStatusState,
  ConnectionStatusApi,
  BaseSlotProps,
  Public
>;

type ConnectionStatusSlots = {
  root: Slot;
  mark: Slot;
  text: Slot<{ text: string }>;
  retry: Slot<{ pending: boolean; label: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ConnectionStatusPrimitive = ReturnType<
  typeof definePrimitive<
    ConnectionStatusOptions,
    ConnectionStatusState,
    ConnectionStatusApi,
    ConnectionStatusSlots
  >
>;

const DEFAULT_LABELS: ConnectionStatusLabels = {
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  offline: "Offline",
  resuming: "Resuming",
  retry: "Retry",
  countdown: (seconds) => `Retrying in ${seconds} s`,
  lost: "Connection lost",
  restored: "Reconnected",
};

const STATES: readonly string[] = ["online", "connecting", "reconnecting", "offline"];

const phaseOf = (options: ConnectionStatusOptions): ConnectionPhase => {
  // Web attributes are untyped: an unknown state reads as online.
  const state = options.state && STATES.includes(options.state) ? options.state : "online";
  return state === "online" && options.resuming ? "resuming" : state;
};

const isLost = (phase: ConnectionPhase) => phase === "reconnecting" || phase === "offline";

const isDown = (phase: ConnectionPhase) => phase !== "online" && phase !== "resuming";

/**
 * The pill's words: "Reconnecting" while a retry is pending, the countdown while reconnecting with time left, else the
 * state's. The default countdown ends in a figure space, a digit wide, per digit it has lost, so "10 s" turning into
 * "9 s" doesn't resize the pill.
 */
export const connectionStatusText = (
  state: Pick<ConnectionStatusState, "shown" | "seconds" | "labels"> &
    Partial<Pick<ConnectionStatusState, "spareDigits" | "pending">>,
): string => {
  if (state.pending) return state.labels.reconnecting;
  if (state.shown !== "reconnecting" || state.seconds <= 0) return state.labels[state.shown];
  const text = state.labels.countdown(state.seconds);
  return state.labels.countdown === DEFAULT_LABELS.countdown
    ? text + "\u2007".repeat(state.spareDigits ?? 0)
    : text;
};

const presentation = (options: ConnectionStatusOptions) => ({
  retryAt: options.retryAt,
  canRetry: options.onRetry !== undefined,
  labels: { ...DEFAULT_LABELS, ...options.labels },
  motion: options.motion ?? "auto",
});

/**
 * The app's connection as a pill that floats over the top of a conversation (spec §7, D18): it takes no room, so
 * coming and going moves nothing. It isn't a live region: losing the connection and getting it back are announced
 * once each, and the countdown never is.
 */
export const connectionStatusPrimitive: ConnectionStatusPrimitive = definePrimitive<
  ConnectionStatusOptions,
  ConnectionStatusState,
  ConnectionStatusApi,
  ConnectionStatusSlots
>({
  name: "kind-connection-status",
  options: {
    state: "string",
    resuming: "boolean",
    retryAt: "string",
    onRetry: "action",
    labels: "value",
    motion: "string",
  },
  state: (options) => {
    const phase = phaseOf(options);
    return {
      ...presentation(options),
      phase,
      shown: phase === "online" ? "connecting" : phase,
      present: phase !== "online",
      started: false,
      // Counted on the client, from the root's `bind`, so server markup and hydration agree.
      seconds: 0,
      spareDigits: 0,
      pending: false,
    };
  },
  sync: presentation,
  live: ["seconds", "spareDigits", "started"],
  controlled: ["phase", "pending"],
  api: (context) => {
    const { store } = context;
    let lost = isLost(store.get().phase);
    const pendingRetry = createPendingAction(context, { state: "pending" });

    context.onOptions((options) => {
      const phase = phaseOf(options);
      if (phase === store.get().phase) return;
      store.set(phase === "online" ? { phase } : { phase, shown: phase, present: true });
      // A retry still pending when the connection comes back belongs to the outage that ended.
      if (!isDown(phase)) pendingRetry.release();
      // A web host sets the state once the element exists, so a connection lost before the first frame isn't news.
      if (!store.get().started) {
        lost = isLost(phase);
        return;
      }
      const labels = { ...DEFAULT_LABELS, ...options.labels };
      if (isLost(phase) && !lost) {
        lost = true;
        announce(labels.lost, { priority: "polite" });
      } else if (!isDown(phase) && lost) {
        lost = false;
        announce(labels.restored, { priority: "polite" });
      }
    });

    const retry = (event?: Event) => {
      const { onRetry } = context.options();
      if (!onRetry) return;
      const reason = event ? "retry-press" : "imperative";
      const details = { reason, source: actionSource(event, reason) } as const;
      void pendingRetry.run(() => onRetry(details));
    };

    return {
      get retry() {
        const { canRetry, pending, phase } = store.get();
        return canRetry && !pending && isDown(phase) ? retry : undefined;
      },
      recovery: createFocusRecovery({
        fallback: (lostFocus) => (lostFocus.el.isConnected ? nearestTabStop(lostFocus.el) : undefined),
      }),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      attrs: (state) => ({
        "aria-label": state.pending ? state.labels.reconnecting : state.labels[state.shown],
        "aria-busy": state.pending ? "true" : undefined,
        hidden: state.present ? undefined : "",
        "data-connection-status-part": "root",
        "data-state": state.shown,
        "data-motion": state.motion,
      }),
      // Comes and goes through CSS on UI SDK's `data-starting-style` and `data-ending-style`, and counts down.
      bind: (el, { store }) => {
        prepareAnnouncements(el.ownerDocument);
        const frame = requestAnimationFrame(() => store.set({ started: true }));
        let showing = store.get().phase !== "online";
        let stop = () => {};
        let counting: string | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let digits = 0;

        const count = (at: number) => {
          const left = at - Date.now();
          const seconds = Math.max(0, Math.ceil(left / 1000));
          const shown = seconds > 0 ? String(seconds).length : 0;
          digits = Math.max(digits, shown);
          store.set({ seconds, spareDigits: shown ? digits - shown : 0 });
          // Wakes on the next whole second, so the number changes when it should.
          if (left > 0) timer = setTimeout(count, left % 1000 || 1000, at);
        };

        const follow = () => {
          const { phase, retryAt } = store.get();
          const target = phase === "reconnecting" ? retryAt : undefined;
          if (target !== counting) {
            counting = target;
            clearTimeout(timer);
            digits = 0;
            const at = target ? Date.parse(target) : Number.NaN;
            if (Number.isNaN(at)) store.set({ seconds: 0, spareDigits: 0 });
            else count(at);
          }
          const shows = phase !== "online";
          if (shows === showing) return;
          showing = shows;
          stop();
          stop = shows ? animateIn(el) : animateOut(el, () => store.set({ present: false }));
        };
        follow();
        const unsubscribe = store.subscribe(follow);
        return () => {
          unsubscribe();
          cancelAnimationFrame(frame);
          clearTimeout(timer);
          stop();
        };
      },
    }),
    mark: slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-connection-status-part": "mark",
        "data-status-mark": "",
        "data-status": state.shown === "offline" && !state.pending ? "warning" : "running",
        "data-motion": state.motion,
      }),
    }),
    text: slot<BaseSlotProps, { text: string }>({
      // Reads the live `seconds`, so a tick renders this part alone.
      state: (state) => ({ text: connectionStatusText(state) }),
      attrs: () => ({ "data-connection-status-part": "text" }),
    }),
    retry: slot<BaseSlotProps, { pending: boolean; label: string }>({
      role: "button",
      focus: "native",
      present: (state) => state.canRetry && state.present && state.phase !== "resuming",
      press: ({ api }, event) => api.retry?.(event),
      state: (state) => ({ pending: state.pending, label: state.labels.retry }),
      attrs: (state) => ({
        type: "button",
        "data-connection-status-part": "retry",
        "data-kind-button": "",
        "data-kind-size": "sm",
        "data-pending": state.pending ? "" : undefined,
      }),
      bind: (el, part) => {
        // Unbound as the pill starts leaving or a retry starts, while Retry still holds focus, so focus moves on
        // before the exit makes it inert or the pending retry hides it.
        let unbind: (() => void) | undefined;
        const follow = () => {
          const { phase, pending } = part.store.get();
          if (isDown(phase) && !pending) unbind ??= part.api.recovery.bind(el, part);
          else {
            unbind?.();
            unbind = undefined;
          }
        };
        follow();
        const unsubscribe = part.store.subscribe(follow);
        return () => {
          unsubscribe();
          unbind?.();
        };
      },
    }),
  }),
  agent: { actions: ["retry"] },
});
