"use client";

import { codeSpans, stepGroupPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import { type ComponentProps, Fragment, type ReactNode } from "react";

const parts = createParts(stepGroupPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  children: "div",
});

export type StepGroupProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  /** The steps, like a `StepList` of `Tool`s, `Terminal`s or `Subagent`s. */
  children?: ReactNode;
};

/**
 * One line that names a turn's work and opens to the host's own steps. Its `children` are the steps; to arrange
 * the parts yourself, use `StepGroupRoot`.
 */
export function StepGroup({ children, ...props }: StepGroupProps) {
  return (
    <parts.Root {...props}>
      {DEFAULT_TRIGGER}
      <StepGroupContent>
        <StepGroupChildren>{children}</StepGroupChildren>
      </StepGroupContent>
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const StepGroupRoot = parts.Root;
export const StepGroupTrigger = parts.Trigger;
export const StepGroupIcon = parts.Icon;
export const StepGroupContent = parts.Content;
export const StepGroupChildren = parts.Children;

// Text with its backticks as `code`.
const withCode = (text: string) =>
  codeSpans(text).map((piece, index) =>
    // biome-ignore lint/suspicious/noArrayIndexKey: the pieces never move.
    index % 2 ? <code key={index}>{piece}</code> : <Fragment key={index}>{piece}</Fragment>,
  );

export type StepGroupTitleProps = ComponentProps<typeof parts.Title>;

/** The work in words, with code as `code`, unless you pass children. */
export function StepGroupTitle({ children = ({ title }) => withCode(title), ...props }: StepGroupTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

export type StepGroupMetaProps = ComponentProps<typeof parts.Meta>;

/** "3 of 5", "1 waiting", "1 failed · 41 sec" or the duration, unless you pass children. */
export function StepGroupMeta({ children = ({ meta }) => meta, ...props }: StepGroupMetaProps) {
  return <parts.Meta {...props}>{children}</parts.Meta>;
}

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_TRIGGER = (
  <StepGroupTrigger>
    <StepGroupIcon />
    <StepGroupTitle />
    <StepGroupMeta />
  </StepGroupTrigger>
);
