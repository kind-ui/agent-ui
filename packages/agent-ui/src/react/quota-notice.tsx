"use client";

import { quotaNoticePrimitive } from "@kind-ui/agent-ui/core";
import { Meter, MeterIndicator, MeterTrack, MeterValue } from "@ui-sdk/react/meter";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps, ReactNode } from "react";

const parts = createParts(quotaNoticePrimitive, {
  root: "div",
  icon: "span",
  title: "p",
  meter: "div",
  reset: "p",
  description: "div",
  actions: "div",
  upgrade: "button",
  dismiss: "button",
});

export type QuotaNoticeProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  /** More text under the bar. */
  children?: ReactNode;
  /** Buttons after Upgrade, like "View usage". */
  actions?: ReactNode;
};

/**
 * A notice about a quota: its mark and title, a bar with the amounts in words, when it resets, any `children`, then
 * Upgrade while `onUpgrade` is set, `actions` and Dismiss while `onDismiss` is set. To arrange the parts yourself,
 * use `QuotaNoticeRoot`.
 */
export function QuotaNotice({ children, actions, ...props }: QuotaNoticeProps) {
  return (
    <parts.Root {...props}>
      <QuotaNoticeIcon />
      <QuotaNoticeTitle />
      <QuotaNoticeMeter />
      <QuotaNoticeReset />
      {children === undefined ? null : <QuotaNoticeDescription>{children}</QuotaNoticeDescription>}
      <QuotaNoticeActions>
        <QuotaNoticeUpgrade />
        {actions}
      </QuotaNoticeActions>
      <QuotaNoticeDismiss />
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const QuotaNoticeRoot = parts.Root;
export const QuotaNoticeIcon = parts.Icon;
export const QuotaNoticeDescription = parts.Description;
export const QuotaNoticeActions = parts.Actions;
export const QuotaNoticeDismiss = parts.Dismiss;

export type QuotaNoticeTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else how much is used, unless you pass children. */
export function QuotaNoticeTitle({ children = ({ label }) => label, ...props }: QuotaNoticeTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

export type QuotaNoticeMeterProps = ComponentProps<typeof parts.Meter>;

/** UI SDK's Meter: a bar and the amounts, unless you pass children, a function that gets the Meter's props. */
export function QuotaNoticeMeter({
  children = ({ label, ...meter }) => (
    <Meter {...meter} aria-label={label} data-agent-hidden="">
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
      <MeterValue />
    </Meter>
  ),
  ...props
}: QuotaNoticeMeterProps) {
  return <parts.Meter {...props}>{children}</parts.Meter>;
}

export type QuotaNoticeResetProps = ComponentProps<typeof parts.Reset>;

/** "Resets in 3 days", unless you pass children. Rendered only with a `resetAt`. */
export function QuotaNoticeReset({ children = ({ text }) => text, ...props }: QuotaNoticeResetProps) {
  return <parts.Reset {...props}>{children}</parts.Reset>;
}

export type QuotaNoticeUpgradeProps = ComponentProps<typeof parts.Upgrade>;

/** Calls `onUpgrade`. Reads the `upgradeLabel` unless you pass children. Rendered only with `onUpgrade`. */
export function QuotaNoticeUpgrade({ children = ({ label }) => label, ...props }: QuotaNoticeUpgradeProps) {
  return <parts.Upgrade {...props}>{children}</parts.Upgrade>;
}
