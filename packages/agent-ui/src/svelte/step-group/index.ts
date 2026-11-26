import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import StepGroup from "./StepGroup.svelte";
import StepGroupCancel from "./StepGroupCancel.svelte";
import StepGroupMeta from "./StepGroupMeta.svelte";
import StepGroupTitle from "./StepGroupTitle.svelte";

export { StepGroup, StepGroupCancel, StepGroupMeta, StepGroupTitle };
/** The bare root, for arranging the parts yourself. */
export const StepGroupRoot = parts.Root;
export const StepGroupTrigger = parts.Trigger;
export const StepGroupIcon = parts.Icon;
export const StepGroupContent = parts.Content;
export const StepGroupChildren = parts.Children;

export type StepGroupProps = ComponentProps<typeof StepGroup>;
export type StepGroupTitleProps = ComponentProps<typeof StepGroupTitle>;
export type StepGroupMetaProps = ComponentProps<typeof StepGroupMeta>;
export type StepGroupCancelProps = ComponentProps<typeof StepGroupCancel>;
