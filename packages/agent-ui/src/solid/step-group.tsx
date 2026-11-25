import { stepGroupPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";

const parts = createParts(stepGroupPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  children: "div",
  cancel: "button",
});

export type StepGroupProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  /** The steps, like a `StepList` of `Tool`s or `Subagent`s. */
  children?: JSX.Element;
};

/**
 * One summary row over the host's own steps: their count in words, their status, and "Stop all" while `onCancel`
 * is set and they run. Its `children` are the steps; to arrange the parts yourself, use `StepGroupRoot`.
 */
export function StepGroup(props: StepGroupProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      <StepGroupTrigger>
        <StepGroupIcon />
        <StepGroupTitle />
        <StepGroupMeta />
      </StepGroupTrigger>
      <StepGroupContent>
        <StepGroupChildren>{props.children}</StepGroupChildren>
      </StepGroupContent>
      <StepGroupCancel />
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const StepGroupRoot = parts.Root;
export const StepGroupTrigger = parts.Trigger;
export const StepGroupIcon = parts.Icon;
export const StepGroupContent = parts.Content;
export const StepGroupChildren = parts.Children;

export type StepGroupTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else the summary of `groupLabels`, unless you pass children. */
export function StepGroupTitle(props: StepGroupTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { title: string }) => state.title)}
    </parts.Title>
  );
}

export type StepGroupMetaProps = ComponentProps<typeof parts.Meta>;

/** "2 running" while steps run, else the duration, unless you pass children. */
export function StepGroupMeta(props: StepGroupMetaProps) {
  return (
    <parts.Meta {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Meta>
  );
}

export type StepGroupCancelProps = ComponentProps<typeof parts.Cancel>;

/** Calls `onCancel`. Reads "Stop all" unless you pass children. Rendered only while the group can be stopped. */
export function StepGroupCancel(props: StepGroupCancelProps) {
  return (
    <parts.Cancel {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
          Stop all
        </>
      )}
    </parts.Cancel>
  );
}
