import { actionPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";
import { Markdown } from "./markdown.js";

const parts = createParts(actionPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  content: "div",
  quote: "blockquote",
  result: "div",
});

export type ActionProps = ComponentProps<typeof parts.Root>;

/**
 * An action run on selected text, as a step: its `label`, the `quote` it ran on and its `result` as streamed markdown.
 * Any `children` replace the default trigger and content.
 */
export function Action(props: ActionProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <ActionTrigger>
            <ActionIcon />
            <ActionTitle />
          </ActionTrigger>
          <ActionContent>
            <ActionQuote />
            <ActionResult />
          </ActionContent>
        </>
      )}
    </parts.Root>
  );
}

export const ActionTrigger = parts.Trigger;
export const ActionIcon = parts.Icon;

export type ActionTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else "Action", unless you pass children. */
export function ActionTitle(props: ActionTitleProps) {
  return <parts.Title {...omit(props, "children")}>{props.children ?? ((state) => state.title)}</parts.Title>;
}

export const ActionContent = parts.Content;

export type ActionQuoteProps = ComponentProps<typeof parts.Quote>;

/** The `quote`, unless you pass children. */
export function ActionQuote(props: ActionQuoteProps) {
  return <parts.Quote {...omit(props, "children")}>{props.children ?? ((state) => state.quote)}</parts.Quote>;
}

export type ActionResultProps = ComponentProps<typeof parts.Result>;

/** The `result` as markdown, streaming while the action runs, unless you pass children. */
export function ActionResult(props: ActionResultProps) {
  return (
    <parts.Result {...omit(props, "children")}>
      {props.children ?? ((state) => <Markdown source={state.result} streaming={state.streaming} />)}
    </parts.Result>
  );
}
