import { type Highlight, type ToolApprovalState, toolPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";
import { CodeBlock } from "./code-block.js";
import { Confirmation } from "./confirmation.js";
import { Markdown } from "./markdown.js";

const parts = createParts(toolPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  approval: "span",
  content: "div",
  input: "div",
  "input-copy": "button",
  output: "div",
  "output-copy": "button",
  retry: "p",
  error: "p",
  "retry-button": "button",
});

// A part whose default slot falls back to `fallback`, as React's default `children` do.
const withDefault = <State, Part extends Component = Component>(
  part: Part,
  name: string,
  fallback: (scope: { state: State }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part as Component, attrs, { ...slots, default: slots.default ?? (fallback as Slot) });
    },
  }) as unknown as Part;

export const ToolTrigger = parts.Trigger;
export const ToolIcon = parts.Icon;
export const ToolContent = parts.Content;
export const ToolInputCopy = parts.InputCopy;
export const ToolOutputCopy = parts.OutputCopy;

/** The tool's name, or the `label`, unless you fill the slot. */
export const ToolTitle = withDefault<{ title: string }>(parts.Title, "ToolTitle", ({ state }) => state.title);

/**
 * A Confirmation for the call's approval while it has one: Approve and Deny while `onApprove` and `onDeny` are set
 * and the request is open, then what was decided. Fill the slot to render it yourself.
 */
// Slot state is a proxy with no keys of its own, so the Confirmation's props are read one by one.
export const ToolApproval = withDefault<ToolApprovalState>(parts.Approval, "ToolApproval", ({ state }) =>
  h(Confirmation, {
    approval: state.approval,
    label: state.label,
    onApprove: state.onApprove,
    onDeny: state.onDeny,
    reason: state.reason,
    focusFallback: state.focusFallback,
    motion: state.motion,
  }),
);

const heading = (text: string, badge: string, copy: Component) =>
  h("div", { "data-tool-heading": "" }, [
    text,
    h("span", { "data-tool-badge": "", "data-kind-badge": "" }, badge),
    h(copy),
  ]);

/**
 * The input as code, labeled "Partial" while it streams, with its copy button, unless you fill the slot. The code
 * block is named by the tool, like "search_docs input".
 */
export const ToolInput = withDefault<{
  label: string;
  code: string;
  streaming: boolean;
  highlight: Highlight | undefined;
}>(parts.Input, "ToolInput", ({ state }) => [
  heading("Input", "Partial", ToolInputCopy),
  h(CodeBlock, {
    "aria-label": state.label,
    header: false,
    code: state.code,
    language: "json",
    streaming: state.streaming,
    highlight: state.highlight,
  }),
]);

/**
 * The output, once there is one: text as markdown, any other value as code. Labeled "Preliminary" until it's final,
 * with its copy button, unless you fill the slot. The code block is named by the tool, like "search_docs output".
 */
export const ToolOutput = withDefault<{
  label: string;
  kind: "markdown" | "code";
  text: string;
  preliminary: boolean;
  highlight: Highlight | undefined;
}>(parts.Output, "ToolOutput", ({ state }) => [
  heading("Output", "Preliminary", ToolOutputCopy),
  state.kind === "markdown"
    ? h(Markdown, { source: state.text, streaming: state.preliminary, highlight: state.highlight })
    : h(CodeBlock, {
        "aria-label": state.label,
        header: false,
        code: state.text,
        language: "json",
        streaming: state.preliminary,
        highlight: state.highlight,
      }),
]);

/** How long the call took, as "N s", unless you fill the slot. Rendered only with `durationSeconds`. */
export const ToolMeta = withDefault<{ duration: string }>(
  parts.Meta,
  "ToolMeta",
  ({ state }) => state.duration,
);

/**
 * While the call retries: "Retrying, attempt 2 of 5, in 4 sec" and the reason, after a running mark, unless you
 * fill the slot.
 */
export const ToolRetry = withDefault<{ text: string }>(parts.Retry, "ToolRetry", ({ state }) => [
  h("span", { "data-status-mark": "", "data-status": "running", "aria-hidden": "true" }),
  state.text,
]);

/** Runs the call again through `onRetry`. Rendered while it's set and the status is `error`. */
export const ToolRetryButton = withDefault(parts.RetryButton, "ToolRetryButton", () => "Retry");

/** The `error` message while the status is `error`, then Retry, unless you fill the slot. */
export const ToolError = withDefault<{ message: string }>(parts.Error, "ToolError", ({ state }) => [
  h("span", { "data-tool-error-message": "" }, state.message),
  h(ToolRetryButton),
]);

const defaultParts = () => [
  h(ToolTrigger, null, () => [h(ToolIcon), h(ToolTitle), h(ToolMeta)]),
  h(ToolContent, null, () => [h(ToolInput), h(ToolOutput), h(ToolRetry), h(ToolError)]),
  h(ToolApproval),
];

/**
 * A tool call as a step: its name and status, then its input, output or error, and its approval. A default slot
 * replaces the default parts.
 */
export const Tool = withDefault(parts.Root, "Tool", defaultParts);
