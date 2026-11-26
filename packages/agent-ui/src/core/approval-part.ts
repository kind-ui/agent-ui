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
   * Called when a person approves and asks not to be asked again, with `always: true` and `alwaysScope` as `scope`.
   * Shows Always allow while set and `risk` isn't `"danger"`. The host keeps the allow list.
   */
  onAlwaysAllow?: ConfirmationCallback;
  /**
   * Shows a box for the reason Deny sends, as Confirmation's `reason` does.
   * @default false
   */
  approvalReason?: boolean;
  /** Approve's label, as Confirmation's `approveLabel`. */
  approveLabel?: string;
  /** @default "Always allow" */
  alwaysLabel?: string;
  /** What Always allow covers, like "search_docs", as Confirmation's `alwaysTarget`. */
  alwaysTarget?: string;
  /** Where Always allow reaches, like "in this project", as Confirmation's `alwaysScope`. */
  alwaysScope?: string;
  /** The line under the choices saying what Always allow covers, as Confirmation's `alwaysDetail`. */
  alwaysDetail?: string;
  /** `"danger"` makes Approve a danger button and leaves out Always allow. */
  risk?: "danger";
  /** What could go wrong, shown above the choices, as Confirmation's `riskText`. */
  riskText?: string;
};

/** The Confirmation the approval part renders. */
export type ApprovalPartState = Pick<
  ConfirmationOptions,
  | "approval"
  | "label"
  | "onApprove"
  | "onDeny"
  | "onAlwaysAllow"
  | "reason"
  | "approveLabel"
  | "alwaysLabel"
  | "alwaysTarget"
  | "alwaysScope"
  | "alwaysDetail"
  | "risk"
  | "riskText"
  | "focusFallback"
  | "motion"
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
  approveLabel: string | undefined;
  alwaysLabel: string | undefined;
  alwaysTarget: string | undefined;
  alwaysScope: string | undefined;
  alwaysDetail: string | undefined;
  risk: "danger" | undefined;
  riskText: string | undefined;
};

type HostState = ApprovalState & { motion: MotionMode };

type HostContext = {
  options: () => ApprovalPartOptions;
  // A method, so a component's context, whose `element` takes only its own slot names, fits.
  element(slot: string): HTMLElement | undefined;
};

export type ApprovalPartConfig<State extends HostState> = {
  /** The Confirmation's question, from the host's state. */
  question: (state: State) => string;
  /** Where focus goes when the choices leave with nothing to take it. Defaults to the trigger part. */
  fallback?: () => HTMLElement | undefined;
};

/**
 * A step's approval (Wave 7 spec §3): its options, its state, the props its Confirmation takes and the `approval`
 * slot that renders it, which Tool and Terminal spread. The slot sits outside the step's content, so a request shows
 * while the step is closed and its outcome stays once decided.
 */
export const approvalPart = {
  options: {
    onApprove: "action",
    onDeny: "action",
    onAlwaysAllow: "action",
    approvalReason: "boolean",
    approveLabel: "string",
    alwaysLabel: "string",
    alwaysTarget: "string",
    alwaysScope: "string",
    alwaysDetail: "string",
    risk: "string",
    riskText: "string",
  } as const,
  /** The state from the approval being shown and the options. Reads options by name: web fills callbacks on read. */
  presentation: (approval: Approval | undefined, options: ApprovalPartOptions): ApprovalState => ({
    approval,
    canApprove: options.onApprove !== undefined,
    canDeny: options.onDeny !== undefined,
    canAlwaysAllow: options.onAlwaysAllow !== undefined,
    approvalReason: options.approvalReason ?? false,
    approveLabel: options.approveLabel,
    alwaysLabel: options.alwaysLabel,
    alwaysTarget: options.alwaysTarget,
    alwaysScope: options.alwaysScope,
    alwaysDetail: options.alwaysDetail,
    risk: options.risk === "danger" ? "danger" : undefined,
    riskText: options.riskText,
  }),
  /** Hands the approval part its Confirmation's props, the same object while they hold. */
  approvalState: <State extends HostState>(
    context: HostContext,
    { question, fallback = () => context.element("trigger") }: ApprovalPartConfig<State>,
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
        approveLabel: string | undefined,
        alwaysLabel: string | undefined,
        alwaysTarget: string | undefined,
        alwaysScope: string | undefined,
        alwaysDetail: string | undefined,
        risk: "danger" | undefined,
        riskText: string | undefined,
      ): ApprovalPartState => ({
        ...(approval && { approval }),
        label,
        reason,
        focusFallback: fallback,
        motion,
        ...(canApprove && { onApprove: approve }),
        ...(canDeny && { onDeny: deny }),
        ...(canAlwaysAllow && { onAlwaysAllow: always }),
        ...(approveLabel !== undefined && { approveLabel }),
        ...(alwaysLabel !== undefined && { alwaysLabel }),
        ...(alwaysTarget !== undefined && { alwaysTarget }),
        ...(alwaysScope !== undefined && { alwaysScope }),
        ...(alwaysDetail !== undefined && { alwaysDetail }),
        ...(risk && { risk }),
        ...(riskText !== undefined && { riskText }),
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
        state.approveLabel,
        state.alwaysLabel,
        state.alwaysTarget,
        state.alwaysScope,
        state.alwaysDetail,
        state.risk,
        state.riskText,
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
