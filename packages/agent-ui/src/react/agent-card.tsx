"use client";

import { agentCardPrimitive } from "@kind-ui/agent-ui/core";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/react/avatar";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps } from "react";

const parts = createParts(agentCardPrimitive, {
  root: "article",
  avatar: "span",
  name: "div",
  model: "p",
  description: "p",
  capabilities: "ul",
  capability: "li",
  status: "span",
  action: "button",
});

export type AgentCardProps = Omit<ComponentProps<typeof parts.Root>, "children">;

/**
 * An agent's identity: its avatar, name, model, status, description and capabilities, and one action while
 * `onAction` is set. To arrange the parts yourself, use `AgentCardRoot`.
 */
export function AgentCard(props: AgentCardProps) {
  return (
    <parts.Root {...props}>
      <AgentCardAvatar />
      <AgentCardName />
      <AgentCardStatus />
      <AgentCardModel />
      <AgentCardAction />
      <AgentCardDescription />
      <AgentCardCapabilities />
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const AgentCardRoot = parts.Root;
export const AgentCardCapability = parts.Capability;

export type AgentCardAvatarProps = ComponentProps<typeof parts.Avatar>;

/** A UI SDK Avatar of the agent's `avatarUrl`, showing its initials until it loads, unless you pass children. */
export function AgentCardAvatar({
  children = ({ initials, src }) => (
    <Avatar>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  ),
  ...props
}: AgentCardAvatarProps) {
  return <parts.Avatar {...props}>{children}</parts.Avatar>;
}

export type AgentCardNameProps = ComponentProps<typeof parts.Name>;

/** The agent's name, a link with an `href`, unless you pass children. */
export function AgentCardName({
  children = ({ name, href }) => (href ? <a href={href}>{name}</a> : name),
  ...props
}: AgentCardNameProps) {
  return <parts.Name {...props}>{children}</parts.Name>;
}

export type AgentCardModelProps = ComponentProps<typeof parts.Model>;

/** The agent's `model`, unless you pass children. Rendered only with one. */
export function AgentCardModel({ children = ({ model }) => model, ...props }: AgentCardModelProps) {
  return <parts.Model {...props}>{children}</parts.Model>;
}

export type AgentCardDescriptionProps = ComponentProps<typeof parts.Description>;

/** The agent's `description`, unless you pass children. Rendered only with one. */
export function AgentCardDescription({
  children = ({ description }) => description,
  ...props
}: AgentCardDescriptionProps) {
  return <parts.Description {...props}>{children}</parts.Description>;
}

export type AgentCardCapabilitiesProps = ComponentProps<typeof parts.Capabilities>;

/** A badge for each of the agent's `capabilities`, unless you pass children. Rendered only with some. */
export function AgentCardCapabilities({
  children = ({ capabilities }) =>
    capabilities.map((capability) => (
      <AgentCardCapability key={capability} value={capability}>
        {capability}
      </AgentCardCapability>
    )),
  ...props
}: AgentCardCapabilitiesProps) {
  return <parts.Capabilities {...props}>{children}</parts.Capabilities>;
}

export type AgentCardStatusProps = ComponentProps<typeof parts.Status>;

/** The status mark and its words, like "Working", unless you pass children. Rendered only with a `status`. */
export function AgentCardStatus({
  children = ({ status, label }) => (
    <>
      <span data-status-mark="" data-status={status} aria-hidden="true" />
      {label}
    </>
  ),
  ...props
}: AgentCardStatusProps) {
  return <parts.Status {...props}>{children}</parts.Status>;
}

export type AgentCardActionProps = ComponentProps<typeof parts.Action>;

/** Calls `onAction`. Reads the `actionLabel` unless you pass children. Rendered only while `onAction` is set. */
export function AgentCardAction({ children = ({ label }) => label, ...props }: AgentCardActionProps) {
  return <parts.Action {...props}>{children}</parts.Action>;
}
