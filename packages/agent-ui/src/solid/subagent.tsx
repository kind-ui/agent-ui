import { subagentPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { Avatar, AvatarImage } from "@ui-sdk/solid/avatar";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit, Show } from "solid-js";
import { Markdown } from "./markdown.js";

const parts = createParts(subagentPrimitive, {
  root: "div",
  trigger: "button",
  avatar: "span",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  children: "div",
  cancel: "button",
  result: "div",
});

export type SubagentProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  /** The subagent's own steps, like a `StepList` of `Tool`s. */
  children?: JSX.Element;
};

/**
 * A subagent's run: its status, name and avatar, then its own steps, a Stop button while `onCancel` is set, and
 * its `result` once complete. Its `children` are the steps; to arrange the parts yourself, use `SubagentRoot`.
 */
export function Subagent(props: SubagentProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      <SubagentTrigger>
        <SubagentIcon />
        <SubagentAvatar />
        <SubagentTitle />
        <SubagentMeta />
      </SubagentTrigger>
      <SubagentContent>
        <SubagentChildren>{props.children}</SubagentChildren>
      </SubagentContent>
      <SubagentCancel />
      <SubagentResult />
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const SubagentRoot = parts.Root;
export const SubagentTrigger = parts.Trigger;
export const SubagentIcon = parts.Icon;
export const SubagentContent = parts.Content;
export const SubagentChildren = parts.Children;

export type SubagentAvatarProps = ComponentProps<typeof parts.Avatar>;

/** A UI SDK Avatar of `avatarSrc`, unless you pass children. Rendered only with an `avatarSrc`. */
export function SubagentAvatar(props: SubagentAvatarProps) {
  return (
    <parts.Avatar {...omit(props, "children")}>
      {props.children ??
        ((state: { src: string | undefined }) => (
          <Avatar>
            <AvatarImage src={state.src} alt="" />
          </Avatar>
        ))}
    </parts.Avatar>
  );
}

export type SubagentTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else the `agentName`, unless you pass children. */
export function SubagentTitle(props: SubagentTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { title: string }) => state.title)}
    </parts.Title>
  );
}

export type SubagentMetaProps = ComponentProps<typeof parts.Meta>;

/** The status in words, like "Working" or "Done in 12 s", unless you pass children. */
export function SubagentMeta(props: SubagentMetaProps) {
  return (
    <parts.Meta {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Meta>
  );
}

export type SubagentCancelProps = ComponentProps<typeof parts.Cancel>;

/** Calls `onCancel`. Reads "Stop" unless you pass children. Rendered only while the subagent can be stopped. */
export function SubagentCancel(props: SubagentCancelProps) {
  return (
    <parts.Cancel {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
          Stop
        </>
      )}
    </parts.Cancel>
  );
}

export type SubagentResultProps = ComponentProps<typeof parts.Result>;

/** The `result` as markdown, unless you pass children. Rendered only once the status is `complete`. */
export function SubagentResult(props: SubagentResultProps) {
  return (
    <parts.Result {...omit(props, "children")}>
      {props.children ??
        ((state: { result: string | undefined }) => (
          <Show when={state.result}>{(result) => <Markdown source={result()} />}</Show>
        ))}
    </parts.Result>
  );
}
