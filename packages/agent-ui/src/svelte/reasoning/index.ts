import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Reasoning from "./Reasoning.svelte";
import ReasoningContent from "./ReasoningContent.svelte";
import ReasoningTitle from "./ReasoningTitle.svelte";

export { Reasoning, ReasoningContent, ReasoningTitle };
export const ReasoningTrigger = parts.Trigger;
export const ReasoningIcon = parts.Icon;

export type ReasoningProps = ComponentProps<typeof Reasoning>;
export type ReasoningTitleProps = ComponentProps<typeof ReasoningTitle>;
export type ReasoningContentProps = ComponentProps<typeof ReasoningContent>;
