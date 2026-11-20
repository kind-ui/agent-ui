import { definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepStatus } from "../../types/index.js";
import { type StepApi, type StepOptions, type StepState, stepBase } from "../step/base.js";

export type ReasoningOptions = Omit<StepOptions, "label" | "durationSeconds"> & {
  /** The model's thoughts so far, as markdown. Appending parses only the blocks that changed. */
  text?: string;
  /**
   * Replaces the title, "Thinking", "Thought for N s", "Thinking failed" or "Thinking stopped", and is announced on
   * completion, so name the outcome in it. A failure or a stop still announces "Thinking failed" or "Thinking
   * stopped".
   */
  label?: string;
  /**
   * How long the model thought, shown as "Thought for N s" once done. Set it with or before `status`, so the
   * summary announced on completion has it. Also written as `--kind-step-duration`.
   */
  durationSeconds?: number;
};

export type ReasoningState = StepState & {
  /** The `label`, or "Thinking" until the step is done and then "Thought for N s", "Thinking failed" or "Thinking stopped". */
  title: string;
  /** The markdown the content renders, from `text`. */
  text: string;
};

type ReasoningSlot<Public extends object = Record<never, never>> = SlotDefinition<
  ReasoningState,
  StepApi,
  BaseSlotProps,
  Public
>;

type ReasoningSlots = {
  root: ReasoningSlot;
  trigger: ReasoningSlot;
  icon: ReasoningSlot;
  title: ReasoningSlot<{ title: string }>;
  content: ReasoningSlot<{ text: string; streaming: boolean }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ReasoningPrimitive = ReturnType<
  typeof definePrimitive<ReasoningOptions, ReasoningState, StepApi, ReasoningSlots>
>;

const THINKING: ReadonlySet<StepStatus> = new Set(["pending", "running", "awaiting-input"]);

const ENDED: Partial<Record<StepStatus, string>> = {
  error: "Thinking failed",
  cancelled: "Thinking stopped",
};

/**
 * "Thinking" until the status is done, then "Thought for N s", rounded and at least 1, or "Thought" without one; a
 * failure or a stop reads "Thinking failed" or "Thinking stopped".
 */
export const reasoningTitle = (status: StepStatus, durationSeconds?: number): string => {
  if (THINKING.has(status)) return "Thinking";
  const ended = ENDED[status];
  if (ended) return ended;
  return durationSeconds === undefined || !Number.isFinite(durationSeconds)
    ? "Thought"
    : `Thought for ${Math.max(1, Math.round(durationSeconds))} s`;
};

const base = stepBase<ReasoningState>({
  kind: "reasoning",
  announcement: (status, _title, state) => (status === "complete" ? state.title : ENDED[status]),
});

const presentation = (options: ReasoningOptions) => ({
  title: options.label ?? reasoningTitle(options.status ?? "pending", options.durationSeconds),
  text: options.text ?? "",
});

export const reasoningPrimitive: ReasoningPrimitive = definePrimitive<
  ReasoningOptions,
  ReasoningState,
  StepApi,
  ReasoningSlots
>({
  name: "kind-reasoning",
  ...base,
  options: { ...base.options, text: "string" },
  state: (options) => ({ ...base.state(options), ...presentation(options) }),
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  slots: (slot) => {
    const { root, trigger, icon, title, content } = base.slots(slot);
    return {
      root,
      trigger,
      icon,
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: (state) => ({ title: state.title }) }),
      content: slot<BaseSlotProps, { text: string; streaming: boolean }>({
        ...content,
        state: (state) => ({ text: state.text, streaming: state.status === "running" }),
      }),
    };
  },
});
