import { connectionStatusPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";

const parts = createParts(connectionStatusPrimitive, {
  root: "div",
  mark: "span",
  text: "span",
  retry: "button",
});

export type ConnectionStatusProps = Omit<ComponentProps<typeof parts.Root>, "children">;

/**
 * The connection as a pill over the top of a conversation: its mark, its words and Retry while `onRetry` is set.
 * Put it inside the Conversation, beside the viewport. To arrange the parts yourself, use `ConnectionStatusRoot`.
 */
export function ConnectionStatus(props: ConnectionStatusProps) {
  return (
    <parts.Root {...props}>
      <ConnectionStatusMark />
      <ConnectionStatusText />
      <ConnectionStatusRetry />
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const ConnectionStatusRoot = parts.Root;
export const ConnectionStatusMark = parts.Mark;

export type ConnectionStatusTextProps = ComponentProps<typeof parts.Text>;

/** The state's words, or the countdown while reconnecting, unless you pass children. */
export function ConnectionStatusText(props: ConnectionStatusTextProps) {
  return (
    <parts.Text {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Text>
  );
}

export type ConnectionStatusRetryProps = ComponentProps<typeof parts.Retry>;

/** "Retry", unless you pass children. Rendered only with `onRetry`. */
export function ConnectionStatusRetry(props: ConnectionStatusRetryProps) {
  return (
    <parts.Retry {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Retry>
  );
}
