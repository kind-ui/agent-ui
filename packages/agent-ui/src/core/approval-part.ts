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
   * Called when the approval is approved and should be remembered, with `always: true` in the decision. Shows Always
   * allow while set. The host keeps the allow list.
   */
  onAlwaysAllow?: ConfirmationCallback;
  /**
   * Shows a box for the reason Deny sends, as Confirmation's `reason` does.
   * @default false
   */
  approvalReason?: boolean;
};

/** The Confirmation the approval part renders. */
export type ApprovalPartState = Pick<
  ConfirmationOptions,
  "approval" | "label" | "onApprove" | "onDeny" | "onAlwaysAllow" | "reason" | "focusFallback" | "motion"
>;

/** What a component that spreads the approval part keeps in its state. */
export type ApprovalState = {
  /** The approval, decided through the Confirmation in the approval part. */
  approval: Approval | undefined;
  /** Whether `onApprove` is set. */
  canApprove: boolean;
  /** Whether `onDeny` is set. */
  canDeny: boolean;
  /** Whether `onAlwaysAllow` is set. */
  canAlwaysAllow: boolean;
  /** The `approvalReason` option. */
  approvalReason: boolean;
};

type HostState = ApprovalState & { motion: MotionMode };

type HostContext = {
  options: () => ApprovalPartOptions;
  // A method, so a component's context, whose `element` takes only its own slot names, fits.
  element(slot: string): HTMLElement | undefined;
};

export type ApprovalPartConfig<State extends HostState> = {
  /** The Confirmation's question. Defaults to Tool's: "Run <title>?", else "Run this tool?". */
  question?: (state: State) => string;
  /** Where focus goes when the choices leave with nothing to take it. Defaults to the trigger part. */
  fallback?: () => HTMLElement | undefined;
};

const runTitle = (state: HostState & { title?: string }) =>
  state.title ? `Run ${state.title}?` : "Run this tool?";

/**
 * A step's approval (spec §3.2): its options, its state, the props its Confirmation takes and the `approval` slot
 * that renders it, which Tool, Terminal and Handoff spread. The slot sits outside the step's content, so a request
 * shows while the step is closed and its outcome stays once decided.
 */
export const approvalPart = {
  options: {
    onApprove: "action",
    onDeny: "action",
    onAlwaysAllow: "action",
    approvalReason: "boolean",
  } as const,
  /** The state from the approval being shown and the options. */
  presentation: (approval: Approval | undefined, options: ApprovalPartOptions): ApprovalState => ({
    approval,
    canApprove: options.onApprove !== undefined,
    canDeny: options.onDeny !== undefined,
    canAlwaysAllow: options.onAlwaysAllow !== undefined,
    approvalReason: options.approvalReason ?? false,
  }),
  /** Hands the approval part its Confirmation's props, the same object while they hold. */
  approvalState: <State extends HostState>(
    context: HostContext,
    { question = runTitle, fallback = () => context.element("trigger") }: ApprovalPartConfig<State> = {},
  ): ((state: State) => ApprovalPartState) => {
    const approve: ConfirmationCallback = (decision, details) =>
      context.options().onApprove?.(decision, details);
    const deny: ConfirmationCallback = (decision, details) => context.options().onDeny?.(decision, details);
    const always: ConfirmationCallback = (decision, details) =>
      context.options().onAlwaysAllow?.(decision, details);
    const build = memo(
      (
        approval: Approval | undefined,
        label: string,
        canApprove: boolean,
        canDeny: boolean,
        canAlwaysAllow: boolean,
        reason: boolean,
        motion: MotionMode,
      ): ApprovalPartState => ({
        ...(approval && { approval }),
        label,
        reason,
        focusFallback: fallback,
        motion,
        ...(canApprove && { onApprove: approve }),
        ...(canDeny && { onDeny: deny }),
        ...(canAlwaysAllow && { onAlwaysAllow: always }),
      }),
    );
    return (state) =>
      build(
        state.approval,
        question(state),
        state.canApprove,
        state.canDeny,
        state.canAlwaysAllow,
        state.approvalReason,
        state.motion,
      );
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
