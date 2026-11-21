import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Subagent from "./Subagent.svelte";
import SubagentAvatar from "./SubagentAvatar.svelte";
import SubagentCancel from "./SubagentCancel.svelte";
import SubagentMeta from "./SubagentMeta.svelte";
import SubagentResult from "./SubagentResult.svelte";
import SubagentTitle from "./SubagentTitle.svelte";

export { Subagent, SubagentAvatar, SubagentCancel, SubagentMeta, SubagentResult, SubagentTitle };
/** The bare root, for arranging the parts yourself. */
export const SubagentRoot = parts.Root;
export const SubagentTrigger = parts.Trigger;
export const SubagentIcon = parts.Icon;
export const SubagentContent = parts.Content;
export const SubagentChildren = parts.Children;

export type SubagentProps = ComponentProps<typeof Subagent>;
export type SubagentAvatarProps = ComponentProps<typeof SubagentAvatar>;
export type SubagentTitleProps = ComponentProps<typeof SubagentTitle>;
export type SubagentMetaProps = ComponentProps<typeof SubagentMeta>;
export type SubagentCancelProps = ComponentProps<typeof SubagentCancel>;
export type SubagentResultProps = ComponentProps<typeof SubagentResult>;
