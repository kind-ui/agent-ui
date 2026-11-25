import { createFocusRecovery, definePrimitive, type SlotDefinition, toLocale } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepStatus } from "../../types/index.js";
import { aggregateStatus } from "../aggregate.js";
import { stepDuration } from "../chain-of-thought/open-steps.js";
import { createPendingAction } from "../pending.js";
import { type StepApi, type StepOptions, type StepState, stepAnnouncement, stepBase } from "../step/base.js";

/** One of the steps a Step Group holds, which core can't read from the host's rows. */
export type StepGroupItem = {
  id: string;
  status: StepStatus;
  /** Which entry of `groupLabels` counts the step, like `"read"` or `"agent"`. */
  group?: string;
};

export type StepGroupOptions = StepOptions & {
  /** The steps inside, in order. Their statuses give the group's status unless `status` is passed. */
  items?: StepGroupItem[];
  /**
   * Turns each group's count into words, as read mid-sentence: `{ read: (n) => \`read ${n} files\` }`. The title
   * joins them in first-seen order and capitalizes the first letter ("Read 2 files and ran 1 command"); steps in no
   * labelled group count as "N steps".
   */
  // Not `labels`: UI SDK's agent bridge reads a web element's `labels` as a form control's.
  groupLabels?: Record<string, (count: number) => string>;
  /** Language for joining the labels. Defaults to English. */
  locale?: string;
  /**
   * Called to stop every step. Shows "Stop all" while set and the group is running. Return a promise to keep it
   * pending until it settles: a rejection makes it available again.
   */
  onCancel?: () => unknown;
};

export type StepGroupState = StepState & {
  /** The `label`, else the summary of `groupLabels`, else "N steps". */
  title: string;
  /** How many items are `running`. */
  running: number;
  /** Whether `onCancel` is set. */
  canCancel: boolean;
  /** Whether a promise `onCancel` returned is still pending. */
  pending: boolean;
};

export type StepGroupApi = StepApi & {
  /** Calls `onCancel`. Offered only while it's set, the group is running, and no cancel is pending. */
  readonly cancel: (() => void) | undefined;
  /** Moves focus to the trigger when Stop all leaves while focused. Called by the cancel slot. */
  cancelRecovery: ReturnType<typeof createFocusRecovery>;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  StepGroupState,
  StepGroupApi,
  BaseSlotProps,
  Public
>;

type StepGroupSlots = {
  root: Slot;
  trigger: Slot;
  icon: Slot;
  title: Slot<{ title: string }>;
  meta: Slot<{ label: string }>;
  content: Slot;
  children: Slot;
  cancel: Slot<{ pending: boolean }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type StepGroupPrimitive = ReturnType<
  typeof definePrimitive<StepGroupOptions, StepGroupState, StepGroupApi, StepGroupSlots>
>;

const steps = (count: number) => (count === 1 ? "1 step" : `${count} steps`);

/** The summary of `items`: each labelled group's words in first-seen order, joined as a list, else "N steps". */
export const stepGroupTitle = (
  items: readonly StepGroupItem[],
  groupLabels: Record<string, (count: number) => string> = {},
  locale?: string,
): string => {
  // Keyed by each group's label, so steps without one count together.
  const counts = new Map<((count: number) => string) | undefined, number>();
  for (const { group } of items) {
    const label = group !== undefined && Object.hasOwn(groupLabels, group) ? groupLabels[group] : undefined;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  if (counts.size === 0) return steps(0);
  const words = [...counts].map(([label, count]) => (label ?? steps)(count));
  const tag = toLocale(locale ?? "en") ?? "en";
  const text = new Intl.ListFormat(tag, { type: "conjunction" }).format(words);
  return text.charAt(0).toLocaleUpperCase(tag) + text.slice(1);
};

/** The meta's words: "2 running" while steps run, else the duration ("12 s"), else nothing. */
export const stepGroupMeta = (running: number, durationSeconds?: number): string =>
  running > 0 ? `${running} running` : stepDuration(durationSeconds);

const base = stepBase<StepGroupState, StepGroupApi, StepGroupOptions>({
  kind: "step-group",
  status: (options) => aggregateStatus((options.items ?? []).map((item) => item.status)),
  announcement: (status, _title, state) => stepAnnouncement(status, state.title),
});

const presentation = (options: StepGroupOptions) => {
  const items = options.items ?? [];
  return {
    title: options.label ?? stepGroupTitle(items, options.groupLabels, options.locale),
    running: items.filter((item) => item.status === "running").length,
    canCancel: options.onCancel !== undefined,
  };
};

const cancellable = (state: StepGroupState) =>
  state.canCancel && (state.status === "running" || state.status === "awaiting-input");

export const stepGroupPrimitive: StepGroupPrimitive = definePrimitive<
  StepGroupOptions,
  StepGroupState,
  StepGroupApi,
  StepGroupSlots
>({
  name: "kind-step-group",
  ...base,
  options: {
    ...base.options,
    items: "value",
    groupLabels: "value",
    locale: "string",
    onCancel: "action",
  },
  state: (options) => ({ ...base.state(options), ...presentation(options), pending: false }),
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  api: (context) => {
    const { store } = context;
    const pendingCancel = createPendingAction(context, { state: "pending" });
    const cancel = () => {
      const { onCancel } = context.options();
      if (onCancel) pendingCancel.run(onCancel);
    };
    return {
      ...base.api(context),
      cancelRecovery: createFocusRecovery({ fallback: () => context.element("trigger") }),
      get cancel() {
        const state = store.get();
        return cancellable(state) && !state.pending ? cancel : undefined;
      },
    };
  },
  slots: (slot) => {
    const { root, title, meta, ...slots } = base.slots(slot);
    return {
      ...slots,
      root: slot({
        ...root,
        attrs: (state, part) => ({
          ...root.attrs?.(state, part),
          "aria-busy": state.pending ? "true" : undefined,
        }),
      }),
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: (state) => ({ title: state.title }) }),
      meta: slot<BaseSlotProps, { label: string }>({
        ...meta,
        state: (state) => ({ label: stepGroupMeta(state.running, state.durationSeconds) }),
      }),
      cancel: slot<BaseSlotProps, { pending: boolean }>({
        role: "button",
        focus: "native",
        present: cancellable,
        press: ({ api }) => api.cancel?.(),
        state: (state) => ({ pending: state.pending }),
        attrs: (state) => ({
          type: "button",
          "data-kind-button": "secondary",
          "aria-disabled": state.pending ? "true" : undefined,
          "data-step-part": "cancel",
          "data-pending": state.pending ? "" : undefined,
        }),
        bind: (el, part) => part.api.cancelRecovery.bind(el, part),
      }),
    };
  },
  agent: { actions: ["expand", "collapse", "cancel"] },
});
