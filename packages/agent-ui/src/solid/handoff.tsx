import { type HandoffAvatarState, handoffPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/solid/avatar";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit, Show } from "solid-js";
import { Confirmation } from "./confirmation.js";

const parts = createParts(handoffPrimitive, {
  root: "div",
  "from-avatar": "span",
  "to-avatar": "span",
  text: "p",
  reason: "blockquote",
  status: "span",
  "status-icon": "span",
  approval: "div",
});

export type HandoffProps = ComponentProps<typeof parts.Root>;

/**
 * One agent handing the conversation to another agent or a person: both avatars, "<from> handed off to <to>", the
 * reason as a quote, the status in words with its mark, and a Confirmation while there's an approval. Pass children
 * to arrange the parts yourself.
 */
export function Handoff(props: HandoffProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <HandoffFromAvatar />
          <HandoffToAvatar />
          <HandoffText />
          <HandoffStatus />
          <HandoffReason />
          <HandoffApproval />
        </>
      )}
    </parts.Root>
  );
}

const avatar = (state: HandoffAvatarState) => (
  <Avatar>
    <Show when={state.src}>{(src) => <AvatarImage src={src()} alt="" />}</Show>
    <AvatarFallback>{state.initials}</AvatarFallback>
  </Avatar>
);

export type HandoffFromAvatarProps = ComponentProps<typeof parts.FromAvatar>;

/** A UI SDK Avatar of the `from` agent, its initials until the image loads, unless you pass children. Agents only. */
export function HandoffFromAvatar(props: HandoffFromAvatarProps) {
  return <parts.FromAvatar {...omit(props, "children")}>{props.children ?? avatar}</parts.FromAvatar>;
}

export type HandoffToAvatarProps = ComponentProps<typeof parts.ToAvatar>;

/** A UI SDK Avatar of the `to` agent, its initials until the image loads, unless you pass children. Agents only. */
export function HandoffToAvatar(props: HandoffToAvatarProps) {
  return <parts.ToAvatar {...omit(props, "children")}>{props.children ?? avatar}</parts.ToAvatar>;
}

export type HandoffTextProps = ComponentProps<typeof parts.Text>;

/** "<from> handed off to <to>", unless you pass children. */
export function HandoffText(props: HandoffTextProps) {
  return <parts.Text {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Text>;
}

export type HandoffReasonProps = ComponentProps<typeof parts.Reason>;

/** The `reason`, unless you pass children. Present only with one. */
export function HandoffReason(props: HandoffReasonProps) {
  return (
    <parts.Reason {...omit(props, "children")}>{props.children ?? ((state) => state.reason)}</parts.Reason>
  );
}

export type HandoffStatusProps = ComponentProps<typeof parts.Status>;

/** The status mark and the status in words, like "Accepted", unless you pass children. */
export function HandoffStatus(props: HandoffStatusProps) {
  return (
    <parts.Status {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <HandoffStatusIcon />
            {state.text}
          </>
        ))}
    </parts.Status>
  );
}

export const HandoffStatusIcon = parts.StatusIcon;

export type HandoffApprovalProps = ComponentProps<typeof parts.Approval>;

/**
 * A Confirmation asking "Let <to> take over?" while there's an approval: the choices whose callbacks are set while
 * the request is open, then what was decided. Pass children to render it yourself.
 */
export function HandoffApproval(props: HandoffApprovalProps) {
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
            focusFallback={state.focusFallback}
            motion={state.motion}
          />
        ))}
    </parts.Approval>
  );
}
