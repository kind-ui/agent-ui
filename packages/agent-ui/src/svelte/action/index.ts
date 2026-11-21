import type { ComponentProps } from "svelte";
import Action from "./Action.svelte";
import ActionQuote from "./ActionQuote.svelte";
import ActionResult from "./ActionResult.svelte";
import ActionTitle from "./ActionTitle.svelte";
import { parts } from "./parts.js";

export const ActionTrigger = parts.Trigger;
export const ActionIcon = parts.Icon;
export const ActionContent = parts.Content;

export { Action, ActionQuote, ActionResult, ActionTitle };
export type ActionProps = ComponentProps<typeof Action>;
export type ActionTitleProps = ComponentProps<typeof ActionTitle>;
export type ActionQuoteProps = ComponentProps<typeof ActionQuote>;
export type ActionResultProps = ComponentProps<typeof ActionResult>;
