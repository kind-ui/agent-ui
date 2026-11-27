import { announce, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepStatus } from "../../types/index.js";
import type { MotionMode } from "../motion/index.js";
import {
  NOT_STALLED,
  STALLED_OPTIONS,
  type StalledOptions,
  type StalledState,
  stalledText,
  watchStalled,
} from "../stalled.js";

export type StatusOptions = StalledOptions & {
  /**
   * The run status the badge shows.
   * @default "pending"
   */
  status?: StepStatus;
  /**
   * The badge's text, announced when the status changes. Defaults to "Pending", "Running", "Needs input",
   * "Complete", "Failed" or "Cancelled".
   */
  label?: string;
  /**
   * How the mark changes between statuses: `"auto"` follows `prefers-reduced-motion`, `"reduced"` fades and
   * `"none"` swaps at once.
   * @default "auto"
   */
  motion?: MotionMode;
};

/** What the badge shows, which agents read through `status`. */
export type StatusState = StalledState & { status: StepStatus; label: string; motion: MotionMode };

type StatusApi = {
  /** Follows `lastActivityAt` while running. Bound by the root. */
  bindStalled: () => () => void;
};

type StatusSlot<Public extends object = Record<never, never>> = SlotDefinition<
  StatusState,
  StatusApi,
  BaseSlotProps,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type StatusPrimitive = ReturnType<
  typeof definePrimitive<
    StatusOptions,
    StatusState,
    StatusApi,
    {
      root: StatusSlot;
      icon: StatusSlot;
      label: StatusSlot<{ label: string }>;
      stalled: StatusSlot<{ text: string }>;
    }
  >
>;

const LABELS: Record<StepStatus, string> = {
  pending: "Pending",
  running: "Running",
  "awaiting-input": "Needs input",
  complete: "Complete",
  error: "Failed",
  cancelled: "Cancelled",
};

const ANNOUNCED: ReadonlySet<StepStatus> = new Set(["awaiting-input", "complete", "error", "cancelled"]);

const presentation = (options: StatusOptions) => {
  // Web attributes are untyped: an unknown status shows as pending, not as a badge with no text.
  const status = options.status && Object.hasOwn(LABELS, options.status) ? options.status : "pending";
  return { status, label: options.label ?? LABELS[status], motion: options.motion ?? "auto" };
};

export const statusPrimitive: StatusPrimitive = definePrimitive({
  name: "kind-status",
  options: { status: "string", label: "string", motion: "string", ...STALLED_OPTIONS },
  state: (options) => ({ ...presentation(options), ...NOT_STALLED }),
  sync: presentation,
  controlled: ["status"],
  api: (context) => {
    let prevStatus = context.store.get().status;
    const stalledInput = (options: StatusOptions) => ({
      running: presentation(options).status === "running",
      lastActivityAt: options.lastActivityAt,
      stalledAfter: options.stalledAfter,
    });
    const stalled = watchStalled(context.store, () => stalledInput(context.options()));
    context.onOptions((options) => {
      stalled.check(stalledInput(options));
      const { status, label } = presentation(options);
      if (status === prevStatus) return;
      prevStatus = status;
      if (ANNOUNCED.has(status)) announce(label, { priority: "polite" });
    });
    return { bindStalled: stalled.bind };
  },
  slots: (slot) => ({
    root: slot({
      attrs: (state) => ({
        "data-status": state.status,
        "data-motion": state.motion,
        "data-stalled": state.stalled ? "" : undefined,
      }),
      bind: (_el, { api }) => api.bindStalled(),
    }),
    icon: slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": state.status,
        "data-motion": state.motion,
      }),
    }),
    label: slot<BaseSlotProps, { label: string }>({
      state: (state) => ({ label: state.label }),
    }),
    // "No update for 5 min", after the label while a running status has had no update for `stalledAfter`.
    stalled: slot<BaseSlotProps, { text: string }>({
      present: (state) => state.stalled,
      state: (state) => ({ text: stalledText(state.stalledMinutes) }),
    }),
  }),
});
