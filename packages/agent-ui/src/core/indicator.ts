import type { definePrimitive, SlotDefinition, SlotFactory } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { cancel, enter, flow, type MotionMode, onReducedMotionChange } from "./motion/index.js";

export type IndicatorOptions = {
  /** Names the status for assistive technology and agents, and is its visible text. Defaults to "Loading",
   * "Thinking" or "Typing". A new label is read out, as the status's content. */
  label?: string;
  /** Defaults to `"auto"`, which follows `prefers-reduced-motion`. Reduced and `"none"` hold the dots still. */
  motion?: MotionMode;
};

export type IndicatorState = { label: string; motion: MotionMode };

type IndicatorApi = Record<never, never>;

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

/**
 * Everything but the name of Loader, Thinking Indicator and Typing Indicator: a polite `status` named by its
 * label, and decorative dots that flow with the `"dot-flow"` preset.
 */
export const indicator = (defaultLabel: string) => {
  const presentation = (options: IndicatorOptions): IndicatorState => ({
    label: options.label ?? defaultLabel,
    motion: options.motion ?? "auto",
  });
  return {
    options: { label: "string", motion: "string" } as const,
    state: presentation,
    sync: presentation,
    api: (): IndicatorApi => ({}),
    slots: (slot: SlotFactory<IndicatorState, IndicatorApi>) => ({
      root: slot({
        role: "status",
        attrs: (state) => ({ "aria-label": state.label, "data-motion": state.motion }),
      }),
      label: slot<BaseSlotProps, { label: string }>({
        attrs: (state) => ({ "data-motion": state.motion }),
        state: (state) => ({ label: state.label }),
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
