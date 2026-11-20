import { definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { type Approval, hasOutput, type StepStatus, type ToolCall } from "../../types/index.js";
import { approvalLabel, isActionable } from "../approval.js";
import { stepDuration } from "../chain-of-thought/open-steps.js";
import { createCopy } from "../clipboard.js";
import type { Highlight } from "../code-block/index.js";
import type { ConfirmationCallback, ConfirmationOptions } from "../confirmation/index.js";
import { memo } from "../memo.js";
import { type StepApi, type StepOptions, type StepState, stepAnnouncement, stepBase } from "../step/base.js";
import { toolCode, toolStatus, toolValue } from "./format.js";

export type ToolOptions = Omit<StepOptions, "status" | "label"> & {
  /** The call to show, from the host. Update it as its input streams, its approval moves and its output arrives. */
  call?: ToolCall;
  /** Defaults to the call's: `error`, `cancelled`, `awaiting-input`, `complete` or `running`, as `toolStatus` reads it. */
  status?: StepStatus;
  /**
   * Replaces the title, which is the tool's name, and names the tool in announcements and in its copy buttons and
   * code blocks ("<label> input"), so keep it a name.
   */
  label?: string;
  /** What went wrong, shown while the status is `error`. Without it, the tool shows "The tool failed." */
  error?: { message: string };
  /** Colors the input and output code, as Code Block's `highlight` does. */
  highlight?: Highlight;
  /** Called when the call's approval is approved, with its `approvalId` and `generation`. Shows Approve while set. */
  onApprove?: ConfirmationCallback;
  /** Called when the call's approval is denied, with its `approvalId`, `generation` and reason. Shows Deny while set. */
  onDeny?: ConfirmationCallback;
  /**
   * Shows a box for the reason Deny sends, as Confirmation's `reason` does.
   * @default false
   */
  approvalReason?: boolean;
};

/** The Confirmation the approval part renders. */
export type ToolApprovalState = Pick<
  ConfirmationOptions,
  "approval" | "label" | "onApprove" | "onDeny" | "reason" | "focusFallback" | "motion"
>;

export type ToolState = StepState & {
  /** The `label`, else the tool's name. */
  title: string;
  /** The call's approval, decided through the Confirmation in the approval part. */
  approval: Approval | undefined;
  /** Whether `onApprove` is set. */
  canApprove: boolean;
  /** Whether `onDeny` is set. */
  canDeny: boolean;
  /** The `approvalReason` option. */
  approvalReason: boolean;
  /** The input code block's name, like "search_docs input", or "Input" without a title. */
  inputLabel: string;
  /** The output code block's name, like "search_docs output", or "Output" without a title. */
  outputLabel: string;
  /** The input as indented JSON, empty before any arrives. */
  input: string;
  /** Whether the input is still arriving, labeled "Partial". */
  inputStreaming: boolean;
  /** How the output shows, or `undefined` while there is none. */
  output: "markdown" | "code" | undefined;
  /** The output as markdown or code, `0`, `false`, `""` and `null` included. */
  outputText: string;
  /** Whether the output may still change, labeled "Preliminary". */
  outputPreliminary: boolean;
  /** The call's outcome, so a denial is announced apart from a cancellation. */
  outcome: ToolCall["outcome"];
  /** The `error` message, else "The tool failed." */
  errorMessage: string;
  /** The `highlight` option. */
  highlight: Highlight | undefined;
  /** True for 2 s after the input is copied. */
  inputCopied: boolean;
  /** True for 2 s after the output is copied. */
  outputCopied: boolean;
};

export type ToolApi = StepApi & {
  /** Copies the input as shown, and resolves with whether the clipboard write went through. Only while there is input. */
  readonly copyInput: (() => Promise<boolean>) | undefined;
  /** Copies the output as shown, and resolves with whether the clipboard write went through. Only while there is output. */
  readonly copyOutput: (() => Promise<boolean>) | undefined;
  /** Hands the approval part its Confirmation's props. Called by the approval slot. */
  approvalState: (state: ToolState) => ToolApprovalState;
};

type ToolSlot<Public extends object = Record<never, never>> = SlotDefinition<
  ToolState,
  ToolApi,
  BaseSlotProps,
  Public
>;

type ToolSlots = {
  root: ToolSlot;
  trigger: ToolSlot;
  icon: ToolSlot;
  title: ToolSlot<{ title: string }>;
  meta: ToolSlot<{ duration: string }>;
  approval: ToolSlot<ToolApprovalState>;
  content: ToolSlot;
  input: ToolSlot<{ label: string; code: string; streaming: boolean; highlight: Highlight | undefined }>;
  "input-copy": ToolSlot;
  output: ToolSlot<{
    label: string;
    kind: "markdown" | "code";
    text: string;
    preliminary: boolean;
    highlight: Highlight | undefined;
  }>;
  "output-copy": ToolSlot;
  error: ToolSlot<{ message: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ToolPrimitive = ReturnType<typeof definePrimitive<ToolOptions, ToolState, ToolApi, ToolSlots>>;

const base = stepBase<ToolState, ToolApi, ToolOptions>({
  kind: "tool",
  // Spec §4.1: a denial and a cancellation are separate outcomes, though both show as `cancelled`.
  announcement: (status, title, state) =>
    state.outcome === "denied" && status === "cancelled"
      ? `${title} denied`
      : stepAnnouncement(status, title),
  status: (options) => (options.call ? toolStatus(options.call) : "pending"),
});

const presentation = ({ call, label, error, highlight, onApprove, onDeny, approvalReason }: ToolOptions) => {
  const output = call && hasOutput(call) ? toolValue(call.output.value) : undefined;
  const title = label ?? call?.name ?? "";
  return {
    title,
    // Named by the tool, so agents and screen readers can tell one tool's input from another's.
    inputLabel: title ? `${title} input` : "Input",
    outputLabel: title ? `${title} output` : "Output",
    approval: call?.approval,
    canApprove: onApprove !== undefined,
    canDeny: onDeny !== undefined,
    approvalReason: approvalReason ?? false,
    input: call?.input.value === undefined ? "" : toolCode(call.input.value),
    inputStreaming: call?.input.state === "streaming",
    output: output?.kind,
    outputText: output ? (output.kind === "markdown" ? output.text : output.code) : "",
    outputPreliminary: call?.output?.state === "preliminary",
    outcome: call?.outcome,
    errorMessage: error?.message ?? "The tool failed.",
    highlight,
  };
};

const copyAttrs = (name: string, copied: boolean) => ({
  type: "button",
  "data-kind-icon-button": "",
  "aria-label": `Copy ${name}`,
  "data-copied": copied ? "" : undefined,
});

export const toolPrimitive: ToolPrimitive = definePrimitive<ToolOptions, ToolState, ToolApi, ToolSlots>({
  name: "kind-tool",
  ...base,
  options: {
    ...base.options,
    call: "value",
    error: "value",
    highlight: "value",
    onApprove: "action",
    onDeny: "action",
    approvalReason: "boolean",
  },
  state: (options) => ({
    ...base.state(options),
    ...presentation(options),
    inputCopied: false,
    outputCopied: false,
  }),
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  api: (context) => {
    const { store } = context;
    const copyInput = createCopy(context, "inputCopied");
    const copyOutput = createCopy(context, "outputCopied");
    const approve: ConfirmationCallback = (decision, details) =>
      context.options().onApprove?.(decision, details);
    const deny: ConfirmationCallback = (decision, details) => context.options().onDeny?.(decision, details);
    const focusTrigger = () => context.element("trigger");
    const approvalState = memo(
      (
        approval: Approval | undefined,
        title: string,
        canApprove: boolean,
        canDeny: boolean,
        reason: boolean,
        motion: ToolState["motion"],
      ): ToolApprovalState => ({
        ...(approval && { approval }),
        label: title ? `Run ${title}?` : "Run this tool?",
        reason,
        focusFallback: focusTrigger,
        motion,
        ...(canApprove && { onApprove: approve }),
        ...(canDeny && { onDeny: deny }),
      }),
    );
    return {
      ...base.api(context),
      get copyInput() {
        const { input } = store.get();
        return input === "" ? undefined : () => copyInput(input);
      },
      get copyOutput() {
        const { output, outputText } = store.get();
        return output === undefined ? undefined : () => copyOutput(outputText);
      },
      approvalState: (state) =>
        approvalState(
          state.approval,
          state.title,
          state.canApprove,
          state.canDeny,
          state.approvalReason,
          state.motion,
        ),
    };
  },
  slots: (slot) => {
    const { root, trigger, icon, title, meta, content } = base.slots(slot);
    return {
      root,
      trigger,
      icon,
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: (state) => ({ title: state.title }) }),
      // How long the call took, once the host passes `durationSeconds`.
      meta: slot<BaseSlotProps, { duration: string }>({
        ...meta,
        present: (state) => stepDuration(state.durationSeconds) !== "",
        state: (state) => ({ duration: stepDuration(state.durationSeconds) }),
      }),
      // Outside the content, so a request shows while the tool is closed, and its outcome stays once decided.
      approval: slot<BaseSlotProps, ToolApprovalState>({
        present: (state) => isActionable(state.approval) || approvalLabel(state.approval) !== undefined,
        state: (state, { api }) => api.approvalState(state),
        attrs: (state) => ({ "data-approval": state.approval?.state }),
      }),
      content,
      input: slot<
        BaseSlotProps,
        { label: string; code: string; streaming: boolean; highlight: Highlight | undefined }
      >({
        state: (state) => ({
          label: state.inputLabel,
          code: state.input,
          streaming: state.inputStreaming,
          highlight: state.highlight,
        }),
        attrs: (state) => ({ "data-state": state.inputStreaming ? "streaming" : "ready" }),
      }),
      "input-copy": slot({
        present: (state) => state.input !== "",
        role: "button",
        focus: "native",
        press: ({ api }) => void api.copyInput?.(),
        attrs: (state) => copyAttrs(state.title ? state.inputLabel : "input", state.inputCopied),
      }),
      output: slot<
        BaseSlotProps,
        {
          label: string;
          kind: "markdown" | "code";
          text: string;
          preliminary: boolean;
          highlight: Highlight | undefined;
        }
      >({
        present: (state) => state.output !== undefined,
        state: (state) => ({
          label: state.outputLabel,
          kind: state.output ?? "code",
          text: state.outputText,
          preliminary: state.outputPreliminary,
          highlight: state.highlight,
        }),
        attrs: (state) => ({
          "data-state": state.outputPreliminary ? "preliminary" : "available",
          "data-kind": state.output,
        }),
      }),
      "output-copy": slot({
        role: "button",
        focus: "native",
        press: ({ api }) => void api.copyOutput?.(),
        attrs: (state) => copyAttrs(state.title ? state.outputLabel : "output", state.outputCopied),
      }),
      error: slot<BaseSlotProps, { message: string }>({
        present: (state) => state.status === "error",
        state: (state) => ({ message: state.errorMessage }),
      }),
    };
  },
  agent: { actions: ["expand", "collapse", "copyInput", "copyOutput"] },
});
