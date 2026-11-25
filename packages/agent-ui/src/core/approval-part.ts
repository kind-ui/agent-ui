import type { SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { Approval } from "../types/index.js";
import { approvalLabel, isActionable } from "./approval.js";
import type { ConfirmationCallback, ConfirmationOptions } from "./confirmation/index.js";
import { memo } from "./memo.js";
import type { MotionMode } from "./motion/index.js";

export type ApprovalPartOptions = {
  /** Called when the approval is approved, with its `approvalId` and `generation`. Shows Approve while set. */
  onApprove?: ConfirmationCallback;
  /** Called when the approval is denied, with its `approvalId`, `generation` and reason. Shows Deny while set. */
  onDeny?: ConfirmationCallback;
  /**
   * Shows a box for the reason Deny sends, as Confirmation's `reason` does.
   * @default false
   */
  approvalReason?: boolean;
};

/** The Confirmation the approval part renders. */
export type ApprovalPartState = Pick<
  ConfirmationOptions,
  "approval" | "label" | "onApprove" | "onDeny" | "reason" | "focusFallback" | "motion"
>;

/** What a component that spreads the approval part keeps in its state. */
export type ApprovalState = {
  /** The approval, decided through the Confirmation in the approval part. */
  approval: Approval | undefined;
  /** Whether `onApprove` is set. */
  canApprove: boolean;
  /** Whether `onDeny` is set. */
  canDeny: boolean;
  /** The `approvalReason` option. */
  approvalReason: boolean;
};

type HostState = ApprovalState & { title: string; motion: MotionMode };

type HostContext = {
  options(): ApprovalPartOptions;
  element(slot: "trigger"): HTMLElement | undefined;
};

/**
 * A step's approval (spec §3.2): its options, its state, the props its Confirmation takes and the `approval` slot
 * that renders it, which Tool, Terminal and Handoff spread. The slot sits outside the step's content, so a request
 * shows while the step is closed and its outcome stays once decided.
 */
export const approvalPart = {
  options: { onApprove: "action", onDeny: "action", approvalReason: "boolean" } as const,
  /** The state from the approval being shown and the options. */
  presentation: (approval: Approval | undefined, options: ApprovalPartOptions): ApprovalState => ({
    approval,
    canApprove: options.onApprove !== undefined,
    canDeny: options.onDeny !== undefined,
    approvalReason: options.approvalReason ?? false,
  }),
  /** Hands the approval part its Confirmation's props, the same object while they hold. Focus falls back to the trigger. */
  approvalState: (context: HostContext): ((state: HostState) => ApprovalPartState) => {
    const approve: ConfirmationCallback = (decision, details) =>
      context.options().onApprove?.(decision, details);
    const deny: ConfirmationCallback = (decision, details) => context.options().onDeny?.(decision, details);
    const focusTrigger = () => context.element("trigger");
    const build = memo(
      (
        approval: Approval | undefined,
        title: string,
        canApprove: boolean,
        canDeny: boolean,
        reason: boolean,
        motion: MotionMode,
      ): ApprovalPartState => ({
        ...(approval && { approval }),
        label: title ? `Run ${title}?` : "Run this tool?",
        reason,
        focusFallback: focusTrigger,
        motion,
        ...(canApprove && { onApprove: approve }),
        ...(canDeny && { onDeny: deny }),
      }),
    );
    return (state) =>
      build(state.approval, state.title, state.canApprove, state.canDeny, state.approvalReason, state.motion);
  },
  /** The `approval` slot: present while the approval waits on a decision or has an outcome to show. */
  slot: <
    State extends HostState,
    Api extends { approvalState: (state: State) => ApprovalPartState },
  >(): SlotDefinition<State, Api, BaseSlotProps, ApprovalPartState> => ({
    present: (state) => isActionable(state.approval) || approvalLabel(state.approval) !== undefined,
    state: (state, { api }) => api.approvalState(state),
    attrs: (state) => ({ "data-approval": state.approval?.state }),
  }),
};
