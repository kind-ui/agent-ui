"use client";

import { stepGroupPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps, ReactNode } from "react";

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
  children?: ReactNode;
};

/**
 * One summary row over the host's own steps: their count in words, their status, and "Stop all" while `onCancel`
 * is set and they run. Its `children` are the steps; to arrange the parts yourself, use `StepGroupRoot`.
 */
export function StepGroup({ children, ...props }: StepGroupProps) {
  return (
    <parts.Root {...props}>
      {DEFAULT_TRIGGER}
      <StepGroupContent>
        <StepGroupChildren>{children}</StepGroupChildren>
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

/** The `label`, else the summary of `labels`, unless you pass children. */
export function StepGroupTitle({ children = ({ title }) => title, ...props }: StepGroupTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

export type StepGroupMetaProps = ComponentProps<typeof parts.Meta>;

/** "2 running" while steps run, else the duration, unless you pass children. */
export function StepGroupMeta({ children = ({ label }) => label, ...props }: StepGroupMetaProps) {
  return <parts.Meta {...props}>{children}</parts.Meta>;
}

export type StepGroupCancelProps = ComponentProps<typeof parts.Cancel>;

/** Calls `onCancel`. Reads "Stop all" unless you pass children. Rendered only while the group can be stopped. */
export function StepGroupCancel({ children = DEFAULT_CANCEL, ...props }: StepGroupCancelProps) {
  return <parts.Cancel {...props}>{children}</parts.Cancel>;
}

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_TRIGGER = (
  <StepGroupTrigger>
    <StepGroupIcon />
    <StepGroupTitle />
    <StepGroupMeta />
  </StepGroupTrigger>
);

const DEFAULT_CANCEL = (
  <>
    <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
    Stop all
  </>
);
