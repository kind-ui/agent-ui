"use client";

import { scheduleCardPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps } from "react";
import { KindSwitch, KindSwitchThumb } from "./internal/switch.js";

const parts = createParts(scheduleCardPrimitive, {
  root: "div",
  icon: "span",
  title: "p",
  description: "p",
  next: "p",
  last: "p",
  "last-mark": "span",
  "last-link": "a",
  enabled: "label",
  "run-now": "button",
  edit: "button",
});

export type ScheduleCardProps = ComponentProps<typeof parts.Root>;
export type ScheduleCardTitleProps = ComponentProps<typeof parts.Title>;
export type ScheduleCardDescriptionProps = ComponentProps<typeof parts.Description>;
export type ScheduleCardNextProps = ComponentProps<typeof parts.Next>;
export type ScheduleCardLastProps = ComponentProps<typeof parts.Last>;
export type ScheduleCardLastLinkProps = ComponentProps<typeof parts.LastLink>;
export type ScheduleCardEnabledProps = ComponentProps<typeof parts.Enabled>;
export type ScheduleCardRunNowProps = ComponentProps<typeof parts.RunNow>;

/** The calendar glyph before the title. */
export const ScheduleCardIcon = parts.Icon;

/** The schedule's `label`, unless you pass children. */
export function ScheduleCardTitle({ children = ({ label }) => label, ...props }: ScheduleCardTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

/** The schedule in the host's words, unless you pass children. */
export function ScheduleCardDescription({
  children = ({ text }) => text,
  ...props
}: ScheduleCardDescriptionProps) {
  return <parts.Description {...props}>{children}</parts.Description>;
}

/** "Next run 9:00 AM", a countdown within the hour, or "Paused", unless you pass children. */
export function ScheduleCardNext({ children = ({ text }) => text, ...props }: ScheduleCardNextProps) {
  return <parts.Next {...props}>{children}</parts.Next>;
}

export const ScheduleCardLastMark = parts.LastMark;

/** How the last run ended and when, linked to its `href`, unless you pass children. */
export function ScheduleCardLastLink({ children = ({ text }) => text, ...props }: ScheduleCardLastLinkProps) {
  return <parts.LastLink {...props}>{children}</parts.LastLink>;
}

const LAST = (
  <>
    <ScheduleCardLastMark />
    <ScheduleCardLastLink />
  </>
);

/** The last run's status mark and words, unless you pass children. Rendered only with a `lastRun`. */
export function ScheduleCardLast({ children = LAST, ...props }: ScheduleCardLastProps) {
  return <parts.Last {...props}>{children}</parts.Last>;
}

const ENABLED: ScheduleCardEnabledProps["children"] = ({ label, ...control }) => (
  <>
    {label}
    {/* Hidden from agents, which use the Schedule Card's own `setEnabled`. */}
    <KindSwitch {...control} data-agent-hidden="">
      <KindSwitchThumb />
    </KindSwitch>
  </>
);

/** "Enabled" and a UI SDK Switch showing `schedule.enabled`, unless you pass children. */
export function ScheduleCardEnabled({ children = ENABLED, ...props }: ScheduleCardEnabledProps) {
  return <parts.Enabled {...props}>{children}</parts.Enabled>;
}

/** Calls `onRunNow`. "Run now", or "Starting" while pending, unless you pass children. Rendered only with `onRunNow`. */
export function ScheduleCardRunNow({ children = ({ label }) => label, ...props }: ScheduleCardRunNowProps) {
  return <parts.RunNow {...props}>{children}</parts.RunNow>;
}

/** Calls `onEdit`, as a pencil icon button named "Edit schedule". Rendered only with `onEdit`. */
export const ScheduleCardEdit = parts.Edit;

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_PARTS = (
  <>
    <ScheduleCardIcon />
    <ScheduleCardTitle />
    <ScheduleCardDescription />
    <ScheduleCardNext />
    <ScheduleCardLast />
    <ScheduleCardEnabled />
    <ScheduleCardRunNow />
    <ScheduleCardEdit />
  </>
);

/**
 * A recurring run: its name and schedule, when it runs next and how it last ran, an Enabled switch, Run now and Edit.
 * Any `children` replace the parts.
 */
export function ScheduleCard({ children = DEFAULT_PARTS, ...props }: ScheduleCardProps) {
  return <parts.Root {...props}>{children}</parts.Root>;
}

/** The bare root, for arranging the parts yourself. */
export const ScheduleCardRoot = parts.Root;
