import { type ScheduleCardEnabledState, scheduleCardPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";
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
export function ScheduleCardTitle(props: ScheduleCardTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Title>
  );
}

/** The schedule in the host's words, unless you pass children. */
export function ScheduleCardDescription(props: ScheduleCardDescriptionProps) {
  return (
    <parts.Description {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Description>
  );
}

/** "Next run 9:00 AM", a countdown within the hour, or "Paused", unless you pass children. */
export function ScheduleCardNext(props: ScheduleCardNextProps) {
  return (
    <parts.Next {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Next>
  );
}

export const ScheduleCardLastMark = parts.LastMark;

/** How the last run ended and when, linked to its `href`, unless you pass children. */
export function ScheduleCardLastLink(props: ScheduleCardLastLinkProps) {
  return (
    <parts.LastLink {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.LastLink>
  );
}

/** The last run's status mark and words, unless you pass children. Rendered only with a `lastRun`. */
export function ScheduleCardLast(props: ScheduleCardLastProps) {
  return (
    <parts.Last {...omit(props, "children")}>
      {props.children ?? (
        <>
          <ScheduleCardLastMark />
          <ScheduleCardLastLink />
        </>
      )}
    </parts.Last>
  );
}

// Part state is a keyless proxy, so each Switch prop is passed by name.
const enabledControl = (state: ScheduleCardEnabledState) => (
  <>
    {state.label}
    {/* Hidden from agents, which use the Schedule Card's own `setEnabled`. */}
    <KindSwitch
      checked={state.checked}
      onCheckedChange={state.onCheckedChange}
      aria-label={state["aria-label"]}
      data-agent-hidden=""
    >
      <KindSwitchThumb />
    </KindSwitch>
  </>
);

/** "Enabled" and a UI SDK Switch showing `schedule.enabled`, unless you pass children. */
export function ScheduleCardEnabled(props: ScheduleCardEnabledProps) {
  return <parts.Enabled {...omit(props, "children")}>{props.children ?? enabledControl}</parts.Enabled>;
}

/** Calls `onRunNow`. "Run now", or "Starting" while pending, unless you pass children. Rendered only with `onRunNow`. */
export function ScheduleCardRunNow(props: ScheduleCardRunNowProps) {
  return (
    <parts.RunNow {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.RunNow>
  );
}

/** Calls `onEdit`, as a pencil icon button named "Edit schedule". Rendered only with `onEdit`. */
export const ScheduleCardEdit = parts.Edit;

/**
 * A recurring run: its name and schedule, when it runs next and how it last ran, an Enabled switch, Run now and Edit.
 * Any `children` replace the parts.
 */
export function ScheduleCard(props: ScheduleCardProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
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
      )}
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const ScheduleCardRoot = parts.Root;
