import {
  announce,
  type ChangeDetails,
  type ChangeSource,
  createFocusRecovery,
  css,
  definePrimitive,
  dispatch,
  live,
  type SlotDefinition,
  sourceOf,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { actionSource } from "../action-source.js";
import type { DictationSource } from "../dictation.js";
import type { MotionMode } from "../motion/index.js";
import { insertText } from "../text-target.js";

/**
 * `"idle"`: the mic button. `"listening"`: the waveform, Stop and Cancel. `"transcribing"`: after Stop, until the
 * source has reported its last text, with the waveform holding its last levels. `"error"`: the mic button and why the
 * last dictation failed.
 */
export type DictationPhase = "idle" | "listening" | "transcribing" | "error";

/**
 * What ended the dictation: Stop (`"stop-press"`), an `api` call like an agent's (`"imperative"`), or the source ending
 * on its own (`"source-end"`).
 */
export type DictationTextReason = "stop-press" | "imperative" | "source-end";

export type DictationOptions = {
  /**
   * Turns speech into text. Without one there's no mic button: Dictation never picks a source itself, so the host
   * decides where audio goes. `createSpeechDictation` is the browser's.
   */
  source?: DictationSource;
  /**
   * Called once when a dictation ends, with its final text. Never for a canceled or failed one, or without text.
   * Inside a Composer the text then goes into the draft, unless you cancel `details`.
   */
  onText?: (text: string, details: ChangeDetails<DictationTextReason>) => void;
  /**
   * Names the mic button and the component.
   * @default "Dictate"
   */
  label?: string;
  /**
   * How many levels the waveform keeps, a whole number from 1 to 256: one bar each, the newest at the end. Bars
   * that don't fit are cut at the start.
   * @default 128
   */
  bars?: number;
  /**
   * Whether an agent needs a person to start a dictation, which opens the microphone.
   * @default true
   */
  agentConfirm?: boolean;
  /**
   * `"auto"` follows `prefers-reduced-motion`. Under reduced motion and `"none"` the waveform holds still.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type DictationState = {
  phase: DictationPhase;
  /** The newest levels, 0 to 1, oldest first: one per bar. */
  levels: number[];
  /** The text recognized so far that may still change. Shown while listening, never sent. */
  interim: string;
  /**
   * Why the last dictation failed, in words, while `phase` is `"error"`. Otherwise `undefined`, since the agent bridge
   * reads any `error` in state as a failed action.
   */
  error: string | undefined;
  /** The `label`, else "Dictate". */
  label: string;
  /** Whether a `source` is set, so the mic button shows. */
  hasSource: boolean;
  /** The `agentConfirm` option. */
  agentConfirm: boolean;
  /** The `motion` option. */
  motion: MotionMode;
};

export type DictationApi = {
  /** Starts listening, and returns whether it did. Offered only with a `source`, while idle or after an error. */
  readonly start: (() => boolean) | undefined;
  /**
   * Stops listening, and returns whether it did; the final text goes to `onText` once the source has reported it.
   * Offered only while listening.
   */
  readonly stop: (() => boolean) | undefined;
  /** Stops, inserts nothing, and returns whether it did. Offered while listening or transcribing. */
  readonly cancel: (() => boolean) | undefined;
  /** Stop, from its button. */
  pressStop: (event?: Event) => boolean;
  /** What the `status` part shows in `state`. */
  statusState: (state: DictationState) => DictationStatusState;
  /** Moves focus between the mic button and Stop as they take each other's place. */
  recovery: ReturnType<typeof createFocusRecovery>;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<DictationState, DictationApi, Props, Public>;

/** What the waveform hands its render function: how many bars to draw. */
export type DictationWaveformState = { bars: number };

/** What the status shows: "Listening" or the interim text, "Transcribing", or the error. */
export type DictationStatusState = { text: string };

type DictationSlots = {
  root: Slot;
  start: Slot;
  waveform: Slot<BaseSlotProps, DictationWaveformState>;
  bar: Slot<{ value: string } & BaseSlotProps>;
  status: Slot<BaseSlotProps, DictationStatusState>;
  "status-icon": Slot;
  stop: Slot;
  cancel: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type DictationPrimitive = ReturnType<
  typeof definePrimitive<DictationOptions, DictationState, DictationApi, DictationSlots>
>;

const ERRORS: Record<string, string> = {
  denied: "Microphone blocked",
  unsupported: "Not supported in this browser",
  "no-speech": "No speech heard",
  network: "Speech service unreachable",
  "audio-capture": "No microphone found",
};

/** The words for an error a source reported. */
const dictationError = (error: string): string => ERRORS[error] ?? "Dictation failed";

/** Joins final texts, which recognizers often start with a space. */
const joinFinals = (finals: readonly string[]): string =>
  finals
    .map((text) => text.trim())
    .filter(Boolean)
    .join(" ");

const MAX_BARS = 256;
const DEFAULT_BARS = 128;
const barCount = ({ bars = DEFAULT_BARS }: DictationOptions) =>
  Number.isFinite(bars) ? Math.min(MAX_BARS, Math.max(1, Math.floor(bars))) : DEFAULT_BARS;
const silence = (bars: number) => Array<number>(bars).fill(0);

const presentation = (options: DictationOptions) => ({
  label: options.label || "Dictate",
  hasSource: options.source !== undefined,
  agentConfirm: options.agentConfirm ?? true,
  motion: options.motion ?? "auto",
});

const statusState = (state: DictationState): DictationStatusState => ({
  text:
    state.phase === "listening"
      ? state.interim || "Listening"
      : state.phase === "transcribing"
        ? "Transcribing"
        : (state.error ?? ""),
});

const isActive = (phase: DictationPhase) => phase === "listening" || phase === "transcribing";

type Run = {
  controller: AbortController;
  stopped?: { reason: DictationTextReason; source: ChangeSource };
};

export const dictationButtonPrimitive: DictationPrimitive = definePrimitive<
  DictationOptions,
  DictationState,
  DictationApi,
  DictationSlots
>({
  name: "kind-dictation",
  options: {
    source: "value",
    onText: "callback",
    label: "string",
    bars: "number",
    agentConfirm: "boolean",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    phase: "idle",
    levels: silence(barCount(options)),
    interim: "",
    error: undefined,
  }),
  sync: presentation,
  // A level or an interim text arrives many times a second; only the parts that show them hear it.
  live: ["levels", "interim"],
  controlled: ["phase", "error"],
  api: (context) => {
    const { store } = context;
    // A run that's no longer current, because it was canceled or another started, writes nothing.
    let run: Run | undefined;

    context.onOptions((options) => {
      // A host that drops its source takes the microphone away. A new source object, like one written inline in
      // React, waits for the next start.
      if (run && !options.source) cancel();
      const bars = barCount(options);
      if (store.get().levels.length !== bars) store.set({ levels: silence(bars) });
    });
    context.onDestroy(() => {
      run?.controller.abort("cancel");
      run = undefined;
    });

    const finish = (patch: Partial<DictationState>) => {
      run = undefined;
      store.set({ interim: "", levels: silence(store.get().levels.length), ...patch });
    };

    const listen = async (source: DictationSource, current: Run) => {
      const finals: string[] = [];
      let failure: string | undefined;
      try {
        for await (const event of source.start(current.controller.signal)) {
          if (run !== current) return;
          if ("error" in event) {
            failure = event.error;
            break;
          }
          if ("level" in event) {
            if (store.get().phase !== "listening") continue;
            const level = Math.min(1, Math.max(0, event.level || 0));
            store.set({ levels: [...store.get().levels.slice(1), level] });
          } else if (event.final) {
            finals.push(event.text);
            store.set({ interim: "" });
          } else store.set({ interim: event.text });
        }
      } catch {
        failure = "failed";
      }
      if (run !== current) return;
      current.controller.abort();
      if (failure !== undefined) {
        const error = dictationError(failure);
        finish({ phase: "error", error });
        announce(error, { priority: "polite" });
        return;
      }
      finish({ phase: "idle" });
      const text = joinFinals(finals);
      const { reason, source: who } = current.stopped ?? { reason: "source-end", source: "programmatic" };
      if (text && !dispatch(context, "onText", text, { reason, source: who }))
        insertText(context.element("root"), text, who);
    };

    const start = () => {
      const { source } = context.options();
      if (!source || isActive(store.get().phase)) return false;
      const current: Run = { controller: new AbortController() };
      run = current;
      store.set({ phase: "listening", error: undefined, interim: "" });
      // An error `onText` throws reaches the host as one thrown from an event, not as an unhandled rejection.
      listen(source, current).catch((error) =>
        queueMicrotask(() => {
          throw error;
        }),
      );
      return true;
    };

    // Who stopped is read now, since `onText` runs once the source has ended, outside this call.
    const stop = (reason: DictationTextReason, event?: Event) => {
      if (!run || store.get().phase !== "listening") return false;
      run.stopped = { reason, source: actionSource(event, reason) };
      // The waveform holds its last levels until the text arrives.
      store.set({ phase: "transcribing" });
      run.controller.abort();
      return true;
    };

    const cancel = () => {
      if (!run) return false;
      run.controller.abort("cancel");
      finish({ phase: "idle" });
      return true;
    };

    return {
      get start() {
        const { hasSource, phase } = store.get();
        return hasSource && !isActive(phase) ? start : undefined;
      },
      get stop() {
        return store.get().phase === "listening" ? () => stop("imperative") : undefined;
      },
      get cancel() {
        return isActive(store.get().phase) ? cancel : undefined;
      },
      pressStop: (event) => stop("stop-press", event),
      statusState,
      recovery: createFocusRecovery({
        fallback: () => context.element(isActive(store.get().phase) ? "stop" : "start"),
      }),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      attrs: (state) => ({
        "aria-label": state.label,
        "data-dictation-part": "root",
        "aria-busy": state.phase === "transcribing" ? "true" : undefined,
        "data-phase": state.phase,
        "data-motion": state.motion,
        // Only starting opens the microphone, so Stop and Cancel don't ask.
        "data-agent-confirm":
          state.agentConfirm && !isActive(state.phase) ? "Opens the microphone for dictation" : undefined,
      }),
      // Starts UI SDK's input tracking, which nothing else here does, so Stop's first keyboard press reads as one.
      // Here rather than at creation, which a server runs too and where it reads `document`.
      bind: () => {
        sourceOf();
      },
    }),
    start: slot({
      role: "button",
      focus: "native",
      present: (state) => state.hasSource && !isActive(state.phase),
      press: ({ api }) => api.start?.(),
      attrs: (state) => ({
        type: "button",
        "aria-label": state.label,
        "data-dictation-part": "start",
        "data-kind-icon-button": "",
        "data-motion": state.motion,
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    waveform: slot<BaseSlotProps, DictationWaveformState>({
      present: (state) => isActive(state.phase),
      state: (state) => ({ bars: state.levels.length }),
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-dictation-part": "waveform",
        "data-motion": state.motion,
      }),
      // One variable per bar, written straight to the element, so a new level renders nothing.
      live: live((state) => ({
        style: css(
          Object.fromEntries(state.levels.map((level, i) => [`--kind-dictation-level-${i}`, String(level)])),
        ),
      })),
    }),
    bar: slot<{ value: string } & BaseSlotProps>({
      props: { value: "string" },
      attrs: (_state, { key }) => ({
        "data-dictation-part": "bar",
        style: css({ "--kind-dictation-bar": `var(--kind-dictation-level-${key}, 0)` }),
      }),
    }),
    // Not a live region: a failure is announced, the words as they're heard aren't.
    status: slot<BaseSlotProps, DictationStatusState>({
      present: (state) => state.phase !== "idle",
      state: (state, { api }) => api.statusState(state),
      attrs: (state) => ({ "data-dictation-part": "status", "data-phase": state.phase }),
    }),
    "status-icon": slot({
      present: (state) => state.phase === "transcribing" || state.phase === "error",
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-dictation-part": "status-icon",
        "data-status-mark": "",
        "data-status": state.phase === "error" ? "error" : "running",
        "data-motion": state.motion,
      }),
    }),
    // Stays through transcribing, unavailable, so focus waits on it until the mic button returns.
    stop: slot({
      role: "button",
      focus: "native",
      present: (state) => isActive(state.phase),
      press: ({ api }, event) => api.pressStop(event),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Stop",
        "data-dictation-part": "stop",
        "data-kind-icon-button": "",
        "aria-disabled": state.phase === "transcribing" ? "true" : undefined,
        "data-pending": state.phase === "transcribing" ? "" : undefined,
        "data-motion": state.motion,
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    cancel: slot({
      role: "button",
      focus: "native",
      present: (state) => isActive(state.phase),
      press: ({ api }) => api.cancel?.(),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Cancel",
        "data-dictation-part": "cancel",
        "data-kind-icon-button": "",
        "data-motion": state.motion,
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
  }),
  agent: { actions: ["start", "stop", "cancel"] },
});
