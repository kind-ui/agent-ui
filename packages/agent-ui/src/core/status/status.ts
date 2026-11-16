import { announce, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepStatus } from "../../types/index.js";
import type { MotionMode } from "../motion/index.js";

export type StatusOptions = {
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
export type StatusState = { status: StepStatus; label: string; motion: MotionMode };

type StatusApi = Record<never, never>;

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
    { root: StatusSlot; icon: StatusSlot; label: StatusSlot<{ label: string }> }
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

const presentation = (options: StatusOptions): StatusState => {
  // Web attributes are untyped: an unknown status shows as pending, not as a badge with no text.
  const status = options.status && Object.hasOwn(LABELS, options.status) ? options.status : "pending";
  return { status, label: options.label ?? LABELS[status], motion: options.motion ?? "auto" };
};

export const statusPrimitive: StatusPrimitive = definePrimitive({
  name: "kind-status",
  options: { status: "string", label: "string", motion: "string" },
  state: presentation,
  sync: presentation,
  controlled: ["status"],
  api: (context) => {
    let prevStatus = context.store.get().status;
    context.onOptions((options) => {
      const { status, label } = presentation(options);
      if (status === prevStatus) return;
      prevStatus = status;
      if (ANNOUNCED.has(status)) announce(label, { priority: "polite" });
    });
    return {};
  },
  slots: (slot) => ({
    root: slot({
      attrs: (state) => ({ "data-status": state.status, "data-motion": state.motion }),
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
  }),
});
