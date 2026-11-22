import { reasoningPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";
import { Markdown } from "./markdown.js";

const parts = createParts(reasoningPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  content: "div",
});

export type ReasoningProps = ComponentProps<typeof parts.Root>;

/**
 * The model's thinking as a step: "Thinking" while it runs, "Thought for N s" once done, and its `text` as streamed
 * markdown. Any `children` replace the default trigger and content.
 */
export function Reasoning(props: ReasoningProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const ReasoningTrigger = parts.Trigger;
export const ReasoningIcon = parts.Icon;

export type ReasoningTitleProps = ComponentProps<typeof parts.Title>;

/** "Thinking", "Thought for N s" or the `label`, unless you pass children. */
export function ReasoningTitle(props: ReasoningTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { title: string }) => state.title)}
    </parts.Title>
  );
}

export type ReasoningContentProps = ComponentProps<typeof parts.Content>;

/** The `text` as markdown, streaming while the step runs, unless you pass children. */
export function ReasoningContent(props: ReasoningContentProps) {
  return (
    <parts.Content {...omit(props, "children")}>
      {props.children ??
        ((state: { text: string; streaming: boolean }) => (
          <Markdown source={state.text} streaming={state.streaming} />
        ))}
    </parts.Content>
  );
}

function DefaultParts() {
  return (
    <>
      <ReasoningTrigger>
        <ReasoningIcon />
        <ReasoningTitle />
      </ReasoningTrigger>
      <ReasoningContent />
    </>
  );
}
