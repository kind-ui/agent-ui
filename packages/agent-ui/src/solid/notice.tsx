import { noticePrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";

const parts = createParts(noticePrimitive, {
  root: "div",
  icon: "span",
  title: "p",
  description: "div",
  reset: "p",
  actions: "div",
  dismiss: "button",
});

export type NoticeProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  /** The notice's text. */
  children?: JSX.Element;
  /** Buttons that act on the notice, like "Retry". */
  actions?: JSX.Element;
};

/**
 * A calm callout: its mark, its `label` as the title, the reset line with `resetsAt`, `children` as its text, then
 * `actions` and Dismiss while `onDismiss` is set and it's `dismissible`. To arrange the parts yourself, use
 * `NoticeRoot`.
 */
export function Notice(props: NoticeProps) {
  const rest = omit(props, "children", "actions");
  return (
    <parts.Root {...rest}>
      <NoticeIcon />
      <NoticeTitle />
      <NoticeReset />
      <NoticeDescription>{props.children}</NoticeDescription>
      <NoticeActions>{props.actions}</NoticeActions>
      <NoticeDismiss />
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const NoticeRoot = parts.Root;
export const NoticeIcon = parts.Icon;
export const NoticeDescription = parts.Description;
export const NoticeActions = parts.Actions;
export const NoticeDismiss = parts.Dismiss;

export type NoticeTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, unless you pass children. Rendered only with a `label`. */
export function NoticeTitle(props: NoticeTitleProps) {
  return <parts.Title {...props}>{props.children ?? ((state) => state.label)}</parts.Title>;
}

export type NoticeResetProps = ComponentProps<typeof parts.Reset>;

/** When the limit resets, like "Resets Tuesday at 9:00 AM.", unless you pass children. Rendered only with `resetsAt`. */
export function NoticeReset(props: NoticeResetProps) {
  return <parts.Reset {...props}>{props.children ?? ((state) => state.text)}</parts.Reset>;
}
