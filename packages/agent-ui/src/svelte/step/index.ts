import { stepListPrimitive, stepPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

const step = createParts(stepPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  children: "div",
});
const list = createParts(stepListPrimitive, { root: "div", item: "button" });

export const Step = step.Root;
export const StepTrigger = step.Trigger;
export const StepIcon = step.Icon;
export const StepTitle = step.Title;
export const StepMeta = step.Meta;
export const StepContent = step.Content;
export const StepChildren = step.Children;
export const StepList = list.Root;
/** Joins a trigger to its list's single Tab stop: render a `StepTrigger` from the item's `render` snippet. */
export const StepListItem = list.Item;
