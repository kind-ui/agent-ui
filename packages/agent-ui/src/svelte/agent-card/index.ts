import type { ComponentProps } from "svelte";
import AgentCard from "./AgentCard.svelte";
import AgentCardAction from "./AgentCardAction.svelte";
import AgentCardAvatar from "./AgentCardAvatar.svelte";
import AgentCardCapabilities from "./AgentCardCapabilities.svelte";
import AgentCardDescription from "./AgentCardDescription.svelte";
import AgentCardModel from "./AgentCardModel.svelte";
import AgentCardName from "./AgentCardName.svelte";
import AgentCardStatus from "./AgentCardStatus.svelte";
import { parts } from "./parts.js";

export {
  AgentCard,
  AgentCardAction,
  AgentCardAvatar,
  AgentCardCapabilities,
  AgentCardDescription,
  AgentCardModel,
  AgentCardName,
  AgentCardStatus,
};
/** The bare root, for arranging the parts yourself. */
export const AgentCardRoot = parts.Root;
export const AgentCardCapability = parts.Capability;
export const AgentCardStatusIcon = parts.StatusIcon;

export type AgentCardProps = ComponentProps<typeof AgentCard>;
export type AgentCardAvatarProps = ComponentProps<typeof AgentCardAvatar>;
export type AgentCardNameProps = ComponentProps<typeof AgentCardName>;
export type AgentCardModelProps = ComponentProps<typeof AgentCardModel>;
export type AgentCardDescriptionProps = ComponentProps<typeof AgentCardDescription>;
export type AgentCardCapabilitiesProps = ComponentProps<typeof AgentCardCapabilities>;
export type AgentCardStatusProps = ComponentProps<typeof AgentCardStatus>;
export type AgentCardActionProps = ComponentProps<typeof AgentCardAction>;
