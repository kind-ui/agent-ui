import { type ChangeDetails, createChange, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import {
  createSegmentedControlController,
  type SegmentedControlController,
} from "@ui-sdk/core/segmented-control";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";

/** A level of reasoning effort: what the host receives, and what a person reads. */
export type ReasoningEffortLevel = { value: string; label: string };

/** `"input-change"`: a person chose a level. `"imperative"`: an `api` call, like an agent's `setValue`. */
export type ReasoningEffortValueChangeReason = "input-change" | "imperative";

export type ReasoningEffortOptions = {
  /**
   * The levels, from least to most effort.
   * @default Low, Medium and High
   */
  levels?: ReasoningEffortLevel[];
  /** The chosen level's value. Passing it controls it: change it in `onValueChange`. */
  value?: string | null;
  /**
   * The chosen level's value at first, when `value` isn't passed.
   * @default null
   */
  defaultValue?: string | null;
  /** Called when a person or `setValue` chooses a level, with why. */
  onValueChange?: (value: string | null, details: ChangeDetails<ReasoningEffortValueChangeReason>) => void;
  /**
   * Names the control.
   * @default "Reasoning effort"
   */
  label?: string;
  /**
   * Whether the levels can't be focused or chosen.
   * @default false
   */
  disabled?: boolean;
  /**
   * How the mark behind the chosen level moves: it slides at full motion and fades under reduced motion.
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ReasoningEffortState = {
  /** The `levels`, else Low, Medium and High. */
  levels: ReasoningEffortLevel[];
  /** The chosen level's value. */
  value: string | null;
  /** The `label`, else "Reasoning effort". */
  label: string;
  /** The `disabled` option. */
  disabled: boolean;
  /** The `motion` option. */
  motion: MotionMode;
};

/** What the root hands the Segmented Control: pass every key to it. */
export type ReasoningEffortControlState = {
  /** The primitive's own, which it reads and writes the chosen level through. */
  controller: SegmentedControlController;
  /** The chosen level when the Segmented Control mounted. */
  defaultValue: string | null;
  /** The `disabled` option. */
  disabled: boolean;
  /** The `label`, which names the radio group. */
  "aria-label": string;
  /** The levels to render, not a prop of the Segmented Control. */
  levels: ReasoningEffortLevel[];
};

export type ReasoningEffortApi = {
  /** The chosen level's value. */
  getValue: () => string | null;
  /** Chooses a level, as a person would. Returns `false` for an unknown level or a refused change. */
  setValue: (value: string) => boolean;
  /** The `levels`. */
  getLevels: () => ReasoningEffortLevel[];
  /** Reports the level a person chose. Called as the Segmented Control's `change` bubbles to the root. */
  read: (event: Event) => void;
  /** Writes the chosen level into the Segmented Control once it has attached the controller. */
  syncValue: () => void;
  /** Hands the Segmented Control its props. Called by the root slot. */
  controlState: (state: ReasoningEffortState) => ReasoningEffortControlState;
};

type ReasoningEffortSlots = {
  root: SlotDefinition<ReasoningEffortState, ReasoningEffortApi, BaseSlotProps, ReasoningEffortControlState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ReasoningEffortPrimitive = ReturnType<
  typeof definePrimitive<
    ReasoningEffortOptions,
    ReasoningEffortState,
    ReasoningEffortApi,
    ReasoningEffortSlots
  >
>;

const defaultLevels: ReasoningEffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const presentation = (options: ReasoningEffortOptions) => ({
  levels: options.levels ?? defaultLevels,
  label: options.label ?? "Reasoning effort",
  disabled: options.disabled ?? false,
  motion: options.motion ?? "auto",
});

export const reasoningEffortPrimitive: ReasoningEffortPrimitive = definePrimitive<
  ReasoningEffortOptions,
  ReasoningEffortState,
  ReasoningEffortApi,
  ReasoningEffortSlots
>({
  name: "kind-reasoning-effort",
  options: {
    levels: "value",
    value: "value",
    defaultValue: "value",
    onValueChange: "callback",
    label: "string",
    disabled: "boolean",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    value: options.value ?? options.defaultValue ?? null,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.value === undefined ? {} : { value: options.value }),
  }),
  controlled: ["value"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const controller = createSegmentedControlController();
    const initial = store.get().value;
    let resync = 0;
    context.onDestroy(() => cancelAnimationFrame(resync));

    const syncValue = () => {
      const { value } = store.get();
      // The controller reads `undefined` until the Segmented Control attaches it.
      const shown = controller.getValue();
      if (shown !== undefined && shown !== value) controller.setValue(value);
    };
    store.subscribe(syncValue);

    const controlState = memo(
      (disabled: boolean, label: string, levels: ReasoningEffortLevel[]): ReasoningEffortControlState => ({
        controller,
        defaultValue: initial,
        disabled,
        "aria-label": label,
        levels,
      }),
    );

    return {
      getValue: () => store.get().value,
      setValue: (value) => {
        const state = store.get();
        if (state.disabled || !state.levels.some((level) => level.value === value)) return false;
        return value === state.value || change("value", value, { reason: "imperative" });
      },
      getLevels: () => store.get().levels,
      read: (event) => {
        const next = controller.getValue() ?? null;
        if (next === store.get().value) return;
        // A change the owner cancels is written back, and so is one a controlling owner didn't take by the next
        // frame: the Segmented Control holds its own value.
        if (!change("value", next, { reason: "input-change", event })) syncValue();
        else if (context.options().value !== undefined) {
          cancelAnimationFrame(resync);
          resync = requestAnimationFrame(syncValue);
        }
      },
      syncValue,
      controlState: (state) => controlState(state.disabled, state.label, state.levels),
    };
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, ReasoningEffortControlState>({
      role: "group",
      state: (state, { api }) => api.controlState(state),
      attrs: (state) => ({
        "aria-label": state.label,
        "data-disabled": state.disabled ? "" : undefined,
        "data-motion": state.motion,
      }),
      // UI SDK's Segmented Control fires a native `change` that bubbles, as native radios do.
      on: { change: (event, { api }) => api.read(event) },
      bind: (_el, { api }) => api.syncValue(),
    }),
  }),
  agent: {
    actions: ["setValue"],
    items: (api: ReasoningEffortApi) =>
      api.getLevels().map((level) => ({ value: level.value, label: level.label })),
    closed: true,
  },
});
