import { definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { type Approval, hasOutput, type StepStatus, type ToolCall } from "../../types/index.js";
import { createCopy } from "../clipboard.js";
import type { Highlight } from "../code-block/index.js";
import { type StepApi, type StepOptions, type StepState, stepBase } from "../step/base.js";
import { approvalLabel, toolCode, toolStatus, toolValue } from "./format.js";

export type ToolOptions = Omit<StepOptions, "status" | "label"> & {
  /** The call to show, from the host. Update it as its input streams, its approval moves and its output arrives. */
  call?: ToolCall;
  /** Defaults to the call's: `error`, `cancelled`, `awaiting-input`, `complete` or `running`, as `toolStatus` reads it. */
  status?: StepStatus;
  /** Replaces the title, which is the tool's name, and names the tool in announcements. */
  label?: string;
  /** What went wrong, shown while the status is `error`. Without it, the tool shows "The tool failed." */
  error?: { message: string };
  /** Colors the input and output code, as Code Block's `highlight` does. */
  highlight?: Highlight;
};

export type ToolState = StepState & {
  /** The `label`, else the tool's name. */
  title: string;
  approval: Approval["state"] | undefined;
  /** Where the approval stands, in words, from `approvalLabel`. */
  approvalLabel: string | undefined;
  /** The input as indented JSON, empty before any arrives. */
  input: string;
  inputStreaming: boolean;
  /** How the output shows, or `undefined` while there is none. */
  output: "markdown" | "code" | undefined;
  /** The output as markdown or code, `0`, `false`, `""` and `null` included. */
  outputText: string;
  outputPreliminary: boolean;
  errorMessage: string;
  highlight: Highlight | undefined;
  inputCopied: boolean;
  outputCopied: boolean;
};

export type ToolApi = StepApi & {
  /** Copies the input as shown, and resolves with whether the clipboard write went through. */
  copyInput: () => Promise<boolean>;
  /** Copies the output as shown, and resolves with whether the clipboard write went through. Only while there is output. */
  readonly copyOutput: (() => Promise<boolean>) | undefined;
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
  approval: ToolSlot<{ label: string }>;
  content: ToolSlot;
  input: ToolSlot<{ code: string; streaming: boolean; highlight: Highlight | undefined }>;
  "input-copy": ToolSlot;
  output: ToolSlot<{
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
  status: (options) => (options.call ? toolStatus(options.call) : "pending"),
});

const presentation = ({ call, label, error, highlight }: ToolOptions) => {
  const output = call && hasOutput(call) ? toolValue(call.output.value) : undefined;
  return {
    title: label ?? call?.name ?? "",
    approval: call?.approval?.state,
    approvalLabel: approvalLabel(call?.approval),
    input: call?.input.value === undefined ? "" : toolCode(call.input.value),
    inputStreaming: call?.input.state === "streaming",
    output: output?.kind,
    outputText: output ? (output.kind === "markdown" ? output.text : output.code) : "",
    outputPreliminary: call?.output?.state === "preliminary",
    errorMessage: error?.message ?? "The tool failed.",
    highlight,
  };
};

const copyAttrs = (label: string, copied: boolean) => ({
  type: "button",
  "aria-label": label,
  "data-copied": copied ? "" : undefined,
});

export const toolPrimitive: ToolPrimitive = definePrimitive<ToolOptions, ToolState, ToolApi, ToolSlots>({
  name: "kind-tool",
  ...base,
  options: { ...base.options, call: "value", error: "value", highlight: "value" },
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
    return {
      ...base.api(context),
      copyInput: () => copyInput(store.get().input),
      get copyOutput() {
        const { output, outputText } = store.get();
        return output === undefined ? undefined : () => copyOutput(outputText);
      },
    };
  },
  slots: (slot) => {
    const { root, trigger, icon, title, content } = base.slots(slot);
    return {
      root,
      trigger,
      icon,
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: (state) => ({ title: state.title }) }),
      approval: slot<BaseSlotProps, { label: string }>({
        present: (state) => state.approvalLabel !== undefined,
        state: (state) => ({ label: state.approvalLabel ?? "" }),
        attrs: (state) => ({ "data-approval": state.approval }),
      }),
      content,
      input: slot<BaseSlotProps, { code: string; streaming: boolean; highlight: Highlight | undefined }>({
        state: (state) => ({
          code: state.input,
          streaming: state.inputStreaming,
          highlight: state.highlight,
        }),
        attrs: (state) => ({ "data-state": state.inputStreaming ? "streaming" : "ready" }),
      }),
      "input-copy": slot({
        role: "button",
        focus: "native",
        press: ({ api }) => void api.copyInput(),
        attrs: (state) => copyAttrs("Copy input", state.inputCopied),
      }),
      output: slot<
        BaseSlotProps,
        { kind: "markdown" | "code"; text: string; preliminary: boolean; highlight: Highlight | undefined }
      >({
        present: (state) => state.output !== undefined,
        state: (state) => ({
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
        attrs: (state) => copyAttrs("Copy output", state.outputCopied),
      }),
      error: slot<BaseSlotProps, { message: string }>({
        present: (state) => state.status === "error",
        state: (state) => ({ message: state.errorMessage }),
      }),
    };
  },
  agent: { actions: ["expand", "collapse", "copyInput", "copyOutput"] },
});
