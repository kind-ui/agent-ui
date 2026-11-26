"use client";

import { handoffPrimitive } from "@kind-ui/agent-ui/core";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/react/avatar";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps } from "react";
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
export function Handoff({ children = DEFAULT_PARTS, ...props }: HandoffProps) {
  return <parts.Root {...props}>{children}</parts.Root>;
}

type AvatarChildren = NonNullable<ComponentProps<typeof parts.FromAvatar>["children"]>;

const avatar: AvatarChildren = ({ src, initials }) => (
  <Avatar>
    {src ? <AvatarImage src={src} alt="" /> : null}
    <AvatarFallback>{initials}</AvatarFallback>
  </Avatar>
);

export type HandoffFromAvatarProps = ComponentProps<typeof parts.FromAvatar>;

/** A UI SDK Avatar of the `from` agent, its initials until the image loads, unless you pass children. Agents only. */
export function HandoffFromAvatar({ children = avatar, ...props }: HandoffFromAvatarProps) {
  return <parts.FromAvatar {...props}>{children}</parts.FromAvatar>;
}

export type HandoffToAvatarProps = ComponentProps<typeof parts.ToAvatar>;

/** A UI SDK Avatar of the `to` agent, its initials until the image loads, unless you pass children. Agents only. */
export function HandoffToAvatar({ children = avatar, ...props }: HandoffToAvatarProps) {
  return <parts.ToAvatar {...props}>{children}</parts.ToAvatar>;
}

export type HandoffTextProps = ComponentProps<typeof parts.Text>;

/** "<from> handed off to <to>", unless you pass children. */
export function HandoffText({ children = ({ text }) => text, ...props }: HandoffTextProps) {
  return <parts.Text {...props}>{children}</parts.Text>;
}

export type HandoffReasonProps = ComponentProps<typeof parts.Reason>;

/** The `reason`, unless you pass children. Present only with one. */
export function HandoffReason({ children = ({ reason }) => reason, ...props }: HandoffReasonProps) {
  return <parts.Reason {...props}>{children}</parts.Reason>;
}

export type HandoffStatusProps = ComponentProps<typeof parts.Status>;

/** The status mark and the status in words, like "Accepted", unless you pass children. */
export function HandoffStatus({
  children = ({ text }) => (
    <>
      <HandoffStatusIcon />
      {text}
    </>
  ),
  ...props
}: HandoffStatusProps) {
  return <parts.Status {...props}>{children}</parts.Status>;
}

export const HandoffStatusIcon = parts.StatusIcon;

export type HandoffApprovalProps = ComponentProps<typeof parts.Approval>;

/**
 * A Confirmation asking "Let <to> take over?" while there's an approval: the choices whose callbacks are set while
 * the request is open, then what was decided. Pass children to render it yourself.
 */
export function HandoffApproval({
  children = (confirmation) => <Confirmation {...confirmation} />,
  ...props
}: HandoffApprovalProps) {
  return <parts.Approval {...props}>{children}</parts.Approval>;
}

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_PARTS = (
  <>
    <HandoffFromAvatar />
    <HandoffToAvatar />
    <HandoffText />
    <HandoffStatus />
    <HandoffReason />
    <HandoffApproval />
  </>
);
