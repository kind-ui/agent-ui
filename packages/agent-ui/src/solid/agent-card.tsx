import {
  type AgentCardAvatarState,
  type AgentCardNameState,
  agentCardPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/solid/avatar";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";

const parts = createParts(agentCardPrimitive, {
  root: "article",
  avatar: "span",
  name: "div",
  model: "p",
  description: "p",
  capabilities: "ul",
  capability: "li",
  status: "span",
  "status-icon": "span",
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
export const AgentCardStatusIcon = parts.StatusIcon;

export type AgentCardAvatarProps = ComponentProps<typeof parts.Avatar>;

/** A UI SDK Avatar of the agent's `avatarUrl`, showing its initials until it loads, unless you pass children. */
export function AgentCardAvatar(props: AgentCardAvatarProps) {
  return (
    <parts.Avatar {...omit(props, "children")}>
      {props.children ??
        ((state: AgentCardAvatarState) => (
          <Avatar>
            <Show when={state.src}>{(src) => <AvatarImage src={src()} alt="" />}</Show>
            <AvatarFallback>{state.initials}</AvatarFallback>
          </Avatar>
        ))}
    </parts.Avatar>
  );
}

export type AgentCardNameProps = ComponentProps<typeof parts.Name>;

/** The agent's name, a link with an `href`, unless you pass children. */
export function AgentCardName(props: AgentCardNameProps) {
  return (
    <parts.Name {...omit(props, "children")}>
      {props.children ??
        ((state: AgentCardNameState) => (
          <Show when={state.href} fallback={state.name}>
            {(href) => <a href={href()}>{state.name}</a>}
          </Show>
        ))}
    </parts.Name>
  );
}

export type AgentCardModelProps = ComponentProps<typeof parts.Model>;

/** The agent's `model`, unless you pass children. Rendered only with one. */
export function AgentCardModel(props: AgentCardModelProps) {
  return (
    <parts.Model {...omit(props, "children")}>
      {props.children ?? ((state: { model: string }) => state.model)}
    </parts.Model>
  );
}

export type AgentCardDescriptionProps = ComponentProps<typeof parts.Description>;

/** The agent's `description`, unless you pass children. Rendered only with one. */
export function AgentCardDescription(props: AgentCardDescriptionProps) {
  return (
    <parts.Description {...omit(props, "children")}>
      {props.children ?? ((state: { description: string }) => state.description)}
    </parts.Description>
  );
}

export type AgentCardCapabilitiesProps = ComponentProps<typeof parts.Capabilities>;

/** A badge for each of the agent's `capabilities`, unless you pass children. Rendered only with some. */
export function AgentCardCapabilities(props: AgentCardCapabilitiesProps) {
  return (
    <parts.Capabilities {...omit(props, "children")}>
      {props.children ??
        ((state: { capabilities: readonly string[] }) => (
          <For each={state.capabilities}>
            {(capability) => <AgentCardCapability value={capability}>{capability}</AgentCardCapability>}
          </For>
        ))}
    </parts.Capabilities>
  );
}

export type AgentCardStatusProps = ComponentProps<typeof parts.Status>;

/** The status mark and its words, like "Working", unless you pass children. Rendered only with a `status`. */
export function AgentCardStatus(props: AgentCardStatusProps) {
  return (
    <parts.Status {...omit(props, "children")}>
      {props.children ??
        ((state: { label: string }) => (
          <>
            <AgentCardStatusIcon />
            {state.label}
          </>
        ))}
    </parts.Status>
  );
}

export type AgentCardActionProps = ComponentProps<typeof parts.Action>;

/** Calls `onAction`. Reads the `actionLabel` unless you pass children. Rendered only while `onAction` is set. */
export function AgentCardAction(props: AgentCardActionProps) {
  return (
    <parts.Action {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Action>
  );
}
