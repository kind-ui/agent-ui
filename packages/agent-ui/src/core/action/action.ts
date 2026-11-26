import type { SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { definePrimitive } from "../define-primitive.js";
import { type StepApi, type StepOptions, type StepState, stepBase } from "../step/base.js";

export type ActionOptions = Omit<StepOptions, "label"> & {
  /**
   * The title, like "Explain". Also names the action in announcements.
   * @default "Action"
   */
  label?: string;
  /** The text the action was run on, shown as a quote above the result. */
  quote?: string;
  /** What the action returned so far, as markdown. Appending parses only the blocks that changed. */
  result?: string;
};

export type ActionState = StepState & {
  /** The `label`, else "Action". */
  title: string;
  /** The `quote` without the whitespace around it, else empty. */
  quote: string;
  /** The `result`, else empty. */
  result: string;
};

type ActionSlot<Public extends object = Record<never, never>> = SlotDefinition<
  ActionState,
  StepApi,
  BaseSlotProps,
  Public
>;

type ActionSlots = {
  root: ActionSlot;
  trigger: ActionSlot;
  icon: ActionSlot;
  title: ActionSlot<{ title: string }>;
  content: ActionSlot;
  quote: ActionSlot<{ quote: string }>;
  result: ActionSlot<{ result: string; streaming: boolean }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ActionPrimitive = ReturnType<
  typeof definePrimitive<ActionOptions, ActionState, StepApi, ActionSlots>
>;

const base = stepBase<ActionState>({ kind: "action" });

const presentation = (options: ActionOptions) => ({
  title: options.label ?? "Action",
  // A triple-clicked paragraph ends in line breaks the quote would show.
  quote: options.quote?.trim() ?? "",
  result: options.result ?? "",
});

export const actionPrimitive: ActionPrimitive = definePrimitive<
  ActionOptions,
  ActionState,
  StepApi,
  ActionSlots
>({
  name: "kind-action",
  ...base,
  options: { ...base.options, quote: "string", result: "string" },
  state: (options) => ({ ...base.state(options), ...presentation(options) }),
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  slots: (slot) => {
    const { root, trigger, icon, title, content } = base.slots(slot);
    return {
      root,
      trigger,
      icon,
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: (state) => ({ title: state.title }) }),
      content,
      quote: slot<BaseSlotProps, { quote: string }>({
        present: (state) => state.quote !== "",
        state: (state) => ({ quote: state.quote }),
        attrs: () => ({ "data-action-part": "quote" }),
      }),
      result: slot<BaseSlotProps, { result: string; streaming: boolean }>({
        present: (state) => state.result !== "",
        state: (state) => ({ result: state.result, streaming: state.status === "running" }),
        attrs: () => ({ "data-action-part": "result" }),
      }),
    };
  },
});
