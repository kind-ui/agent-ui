import { createFocusRecovery, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepStatus } from "../../types/index.js";
import { stepDuration } from "../chain-of-thought/open-steps.js";
import { type StepApi, type StepOptions, type StepState, stepBase } from "../step/base.js";

export type SubagentOptions = StepOptions & {
  /** The subagent's name: the title, unless `label` replaces it, and the avatar's initials. */
  agentName?: string;
  /** The avatar image. Without it, or until it loads, the avatar shows the name's initials. */
  avatarSrc?: string;
  /** The subagent's final answer, as markdown, shown once the status is `complete`. */
  result?: string;
  /**
   * Called when the subagent is stopped. Shows the Stop button while set and the subagent hasn't finished. Return
   * a promise to keep Stop pending until it settles: a rejection makes it available again.
   */
  onCancel?: () => unknown;
  /**
   * Whether an agent needs a person to approve its actions on the subagent. UI SDK marks a whole component, so
   * `expand` and `collapse` ask too.
   * @default true
   */
  agentConfirm?: boolean;
};

export type SubagentState = StepState & {
  /** The `label`, else the `agentName`, else "Subagent". */
  title: string;
  /** The `agentName`. */
  agentName: string;
  /** The `avatarSrc`. */
  avatarSrc: string | undefined;
  /** The `result`, or empty. */
  result: string;
  /** Whether `onCancel` is set. */
  canCancel: boolean;
  /** Whether a promise `onCancel` returned is still pending. */
  pending: boolean;
  /** The `agentConfirm` option. */
  agentConfirm: boolean;
};

export type SubagentApi = StepApi & {
  /** Calls `onCancel`. Offered only while it's set, the subagent hasn't finished, and no cancel is pending. */
  readonly cancel: (() => void) | undefined;
  /** Moves focus to the trigger when Stop leaves while focused. Called by the cancel slot. */
  cancelRecovery: ReturnType<typeof createFocusRecovery>;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  SubagentState,
  SubagentApi,
  BaseSlotProps,
  Public
>;

type SubagentSlots = {
  root: Slot;
  trigger: Slot;
  avatar: Slot<{ name: string; initials: string; src: string | undefined }>;
  icon: Slot;
  title: Slot<{ title: string }>;
  meta: Slot<{ label: string }>;
  content: Slot;
  children: Slot;
  cancel: Slot<{ pending: boolean }>;
  result: Slot<{ result: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type SubagentPrimitive = ReturnType<
  typeof definePrimitive<SubagentOptions, SubagentState, SubagentApi, SubagentSlots>
>;

/** The first letters of the first two words of `name`, in upper case, or "?" when it has none. */
export const initials = (name: string): string =>
  (name.match(/\S+/gu) ?? [])
    .slice(0, 2)
    .map(([first]) => first)
    .join("")
    .toUpperCase() || "?";

const STATUS_LABELS: Record<StepStatus, string> = {
  pending: "Waiting",
  running: "Working",
  "awaiting-input": "Needs input",
  complete: "Done",
  error: "Failed",
  cancelled: "Stopped",
};

/** The status in words, with the time it took once complete: "Working", "Done in 12 s". */
export const subagentStatus = (status: StepStatus, durationSeconds?: number): string => {
  const duration = status === "complete" ? stepDuration(durationSeconds) : "";
  return duration ? `Done in ${duration}` : STATUS_LABELS[status];
};

const ACTIVE = new Set<StepStatus>(["pending", "running", "awaiting-input"]);

const base = stepBase<SubagentState, SubagentApi, SubagentOptions>({ kind: "subagent" });

const presentation = (options: SubagentOptions) => ({
  title: options.label ?? (options.agentName || "Subagent"),
  agentName: options.agentName ?? "",
  avatarSrc: options.avatarSrc || undefined,
  result: options.result ?? "",
  canCancel: options.onCancel !== undefined,
  agentConfirm: options.agentConfirm ?? true,
});

const cancellable = (state: SubagentState) => state.canCancel && ACTIVE.has(state.status);

export const subagentPrimitive: SubagentPrimitive = definePrimitive<
  SubagentOptions,
  SubagentState,
  SubagentApi,
  SubagentSlots
>({
  name: "kind-subagent",
  ...base,
  options: {
    ...base.options,
    agentName: "string",
    avatarSrc: "string",
    result: "string",
    onCancel: "action",
    agentConfirm: "boolean",
  },
  state: (options) => ({ ...base.state(options), ...presentation(options), pending: false }),
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  api: (context) => {
    const { store } = context;
    let destroyed = false;
    context.onDestroy(() => {
      destroyed = true;
    });
    const cancel = () => {
      const { onCancel } = context.options();
      if (!onCancel || store.get().pending) return;
      store.set({ pending: true });
      const settle = () => {
        if (!destroyed) store.set({ pending: false });
      };
      // A host that throws gets Stop back, as one that rejects does.
      new Promise((resolve) => resolve(onCancel())).then(settle, settle);
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
          // UI SDK marks a whole component, so every subagent action asks the person while it's on.
          "data-agent-confirm": state.agentConfirm ? "Stops the subagent for you" : undefined,
        }),
      }),
      avatar: slot<BaseSlotProps, { name: string; initials: string; src: string | undefined }>({
        state: (state) => ({
          name: state.agentName,
          initials: initials(state.agentName),
          src: state.avatarSrc,
        }),
        // The title beside it names the subagent.
        attrs: () => ({ "aria-hidden": "true", "data-step-part": "avatar" }),
      }),
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: (state) => ({ title: state.title }) }),
      meta: slot<BaseSlotProps, { label: string }>({
        ...meta,
        state: (state) => ({ label: subagentStatus(state.status, state.durationSeconds) }),
      }),
      cancel: slot<BaseSlotProps, { pending: boolean }>({
        role: "button",
        focus: "native",
        present: cancellable,
        press: ({ api }) => api.cancel?.(),
        state: (state) => ({ pending: state.pending }),
        attrs: (state) => ({
          type: "button",
          "aria-disabled": state.pending ? "true" : undefined,
          "data-step-part": "cancel",
          "data-pending": state.pending ? "" : undefined,
        }),
        bind: (el, part) => part.api.cancelRecovery.bind(el, part),
      }),
      result: slot<BaseSlotProps, { result: string }>({
        present: (state) => state.status === "complete",
        state: (state) => ({ result: state.result }),
        attrs: (state) => ({ "data-step-part": "result", "data-motion": state.motion }),
      }),
    };
  },
  agent: { actions: ["expand", "collapse", "cancel"] },
});
