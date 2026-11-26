import type { definePrimitive, PrimitiveContext, SlotDefinition, SlotFactory } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { cancel, enter, flow, type MotionMode, onReducedMotionChange } from "./motion/index.js";
import {
  NOT_STALLED,
  STALLED_OPTIONS,
  type StalledOptions,
  type StalledState,
  stalledText,
  watchStalled,
} from "./stalled.js";
import { WORDS } from "./words.js";

export type IndicatorOptions = StalledOptions & {
  /**
   * Names the status, and screen readers read it again when it changes. Loader and Thinking Indicator also show
   * it; it defaults to "Loading…", "Thinking…" or "Typing".
   */
  label?: string;
  /**
   * Whether the dots move: `"auto"` follows `prefers-reduced-motion`, and `"reduced"` or `"none"` hold them still.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type IndicatorState = StalledState & {
  /** The label, or "Still working · no update for 2 min" while stalled. */
  label: string;
  motion: MotionMode;
};

type IndicatorApi = {
  /** Follows `lastActivityAt`. Bound by the root. */
  bindStalled: () => () => void;
};

type IndicatorSlot<Public extends object = Record<never, never>> = SlotDefinition<
  IndicatorState,
  IndicatorApi,
  BaseSlotProps,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type IndicatorPrimitive = ReturnType<
  typeof definePrimitive<
    IndicatorOptions,
    IndicatorState,
    IndicatorApi,
    {
      root: IndicatorSlot;
      label: IndicatorSlot<{ label: string }>;
      dots: IndicatorSlot;
      dot: IndicatorSlot;
    }
  >
>;

/** The words shown and read: the label, or "Still working · no update for 2 min" while stalled. */
export const indicatorLabel = (state: IndicatorState): string =>
  state.stalled
    ? `${WORDS.stillWorking} · ${stalledText(state.stalledMinutes).replace(/^./, (first) => first.toLowerCase())}`
    : state.label;

/**
 * Everything but the name of Loader, Thinking Indicator and Typing Indicator: a polite `status` named by its
 * label, and decorative dots that flow with the `"dot-flow"` preset.
 */
export const indicator = (defaultLabel: string) => {
  const presentation = (options: IndicatorOptions) => ({
    label: options.label ?? defaultLabel,
    motion: options.motion ?? "auto",
  });
  return {
    options: { label: "string", motion: "string", ...STALLED_OPTIONS } as const,
    state: (options: IndicatorOptions): IndicatorState => ({ ...presentation(options), ...NOT_STALLED }),
    sync: presentation,
    api: (context: PrimitiveContext<IndicatorOptions, IndicatorState, string>): IndicatorApi => {
      const stalledInput = (options: IndicatorOptions) => ({
        running: true,
        lastActivityAt: options.lastActivityAt,
        stalledAfter: options.stalledAfter,
      });
      const stalled = watchStalled(context.store, () => stalledInput(context.options()));
      context.onOptions((options) => stalled.check(stalledInput(options)));
      return { bindStalled: stalled.bind };
    },
    slots: (slot: SlotFactory<IndicatorState, IndicatorApi>) => ({
      root: slot({
        role: "status",
        attrs: (state) => ({
          "aria-label": indicatorLabel(state),
          "data-motion": state.motion,
          "data-stalled": state.stalled ? "" : undefined,
        }),
        bind: (_el, { api }) => api.bindStalled(),
      }),
      label: slot<BaseSlotProps, { label: string }>({
        attrs: (state) => ({ "data-motion": state.motion }),
        state: (state) => ({ label: indicatorLabel(state) }),
      }),
      dots: slot({
        attrs: (state) => ({ "aria-hidden": "true", "data-motion": state.motion }),
        bind: (el, { store }) => {
          let { motion } = store.get();
          let bound = true;
          // Web parts bind as they connect, before the dots inside have their `data-dot`.
          queueMicrotask(() => {
            if (bound) void enter(el, "dot-flow", { motion });
          });
          const unsubscribe = store.subscribe(() => {
            if (store.get().motion === motion) return;
            motion = store.get().motion;
            flow(el, { motion });
          });
          const unwatch = onReducedMotionChange(() => {
            if (motion === "auto") flow(el, { motion });
          });
          return () => {
            bound = false;
            unsubscribe();
            unwatch();
            cancel(el);
          };
        },
      }),
      dot: slot({ attrs: () => ({ "data-dot": "" }) }),
    }),
    agent: { actions: [] },
  };
};
