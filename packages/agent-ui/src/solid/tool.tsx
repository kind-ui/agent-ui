import { toolPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit, Show } from "solid-js";
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
  error: "p",
});

export type ToolProps = ComponentProps<typeof parts.Root>;

/**
 * A tool call as a step: its name and status, then its input, output or error, and its approval. Any `children`
 * replace the default parts.
 */
export function Tool(props: ToolProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const ToolTrigger = parts.Trigger;
export const ToolIcon = parts.Icon;
export const ToolContent = parts.Content;
export const ToolInputCopy = parts.InputCopy;
export const ToolOutputCopy = parts.OutputCopy;

export type ToolTitleProps = ComponentProps<typeof parts.Title>;

/** The tool's name, or the `label`, unless you pass children. */
export function ToolTitle(props: ToolTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { title: string }) => state.title)}
    </parts.Title>
  );
}

export type ToolApprovalProps = ComponentProps<typeof parts.Approval>;

/**
 * A Confirmation for the call's approval while it has one: Approve and Deny while `onApprove` and `onDeny` are
 * set and the request is open, then what was decided. Pass children to render it yourself.
 */
export function ToolApproval(props: ToolApprovalProps) {
  return (
    <parts.Approval {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <Confirmation
            approval={state.approval}
            label={state.label}
            onApprove={state.onApprove}
            onDeny={state.onDeny}
            onAlwaysAllow={state.onAlwaysAllow}
            reason={state.reason}
            approveLabel={state.approveLabel}
            alwaysLabel={state.alwaysLabel}
            alwaysTarget={state.alwaysTarget}
            alwaysScope={state.alwaysScope}
            alwaysDetail={state.alwaysDetail}
            risk={state.risk}
            riskText={state.riskText}
            focusFallback={state.focusFallback}
            motion={state.motion}
          />
        ))}
    </parts.Approval>
  );
}

export type ToolInputProps = ComponentProps<typeof parts.Input>;

/**
 * The input as code, labeled "Partial" while it streams, with its copy button, unless you pass children. The code
 * block is named by the tool, like "search_docs input".
 */
export function ToolInput(props: ToolInputProps) {
  return (
    <parts.Input {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <div data-tool-heading="">
              Input
              <span data-tool-badge="" data-kind-badge="">
                Partial
              </span>
              <ToolInputCopy />
            </div>
            <CodeBlock
              aria-label={state.label}
              header={false}
              code={state.code}
              language="json"
              streaming={state.streaming}
              highlight={state.highlight}
            />
          </>
        ))}
    </parts.Input>
  );
}

export type ToolOutputProps = ComponentProps<typeof parts.Output>;

/**
 * The output, once there is one: text as markdown, any other value as code. Labeled "Preliminary" until it's final,
 * with its copy button, unless you pass children. The code block is named by the tool, like "search_docs output".
 */
export function ToolOutput(props: ToolOutputProps) {
  return (
    <parts.Output {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <div data-tool-heading="">
              Output
              <span data-tool-badge="" data-kind-badge="">
                Preliminary
              </span>
              <ToolOutputCopy />
            </div>
            <Show
              when={state.kind === "markdown"}
              fallback={
                <CodeBlock
                  aria-label={state.label}
                  header={false}
                  code={state.text}
                  language="json"
                  streaming={state.preliminary}
                  highlight={state.highlight}
                />
              }
            >
              <Markdown source={state.text} streaming={state.preliminary} highlight={state.highlight} />
            </Show>
          </>
        ))}
    </parts.Output>
  );
}

export type ToolMetaProps = ComponentProps<typeof parts.Meta>;

/** How long the call took, as "N s", unless you pass children. Rendered only with `durationSeconds`. */
export function ToolMeta(props: ToolMetaProps) {
  return (
    <parts.Meta {...omit(props, "children")}>
      {props.children ?? ((state: { duration: string }) => state.duration)}
    </parts.Meta>
  );
}

export type ToolErrorProps = ComponentProps<typeof parts.Error>;

/** The `error` message while the status is `error`, unless you pass children. */
export function ToolError(props: ToolErrorProps) {
  return (
    <parts.Error {...omit(props, "children")}>
      {props.children ?? ((state: { message: string }) => state.message)}
    </parts.Error>
  );
}

function DefaultParts() {
  return (
    <>
      <ToolTrigger>
        <ToolIcon />
        <ToolTitle />
        <ToolMeta />
      </ToolTrigger>
      <ToolContent>
        <ToolInput />
        <ToolOutput />
        <ToolError />
      </ToolContent>
      <ToolApproval />
    </>
  );
}
