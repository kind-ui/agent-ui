import { type QuotaNoticeMeterState, quotaNoticePrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { Meter, MeterIndicator, MeterTrack, MeterValue } from "@ui-sdk/solid/meter";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";

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
  children?: JSX.Element;
  /** Buttons after Upgrade, like "View usage". */
  actions?: JSX.Element;
};

/**
 * A notice about a quota: its mark and title, a bar with the amounts in words, when it resets, any `children`, then
 * Upgrade while `onUpgrade` is set, `actions` and Dismiss while `onDismiss` is set. To arrange the parts yourself,
 * use `QuotaNoticeRoot`.
 */
export function QuotaNotice(props: QuotaNoticeProps) {
  const rest = omit(props, "children", "actions");
  return (
    <parts.Root {...rest}>
      <QuotaNoticeIcon />
      <QuotaNoticeTitle />
      <QuotaNoticeMeter />
      <QuotaNoticeReset />
      {(() => {
        const children = props.children;
        return children === undefined ? null : <QuotaNoticeDescription>{children}</QuotaNoticeDescription>;
      })()}
      <QuotaNoticeActions>
        <QuotaNoticeUpgrade />
        {props.actions}
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
export function QuotaNoticeTitle(props: QuotaNoticeTitleProps) {
  return <parts.Title {...props}>{props.children ?? ((state) => state.label)}</parts.Title>;
}

export type QuotaNoticeMeterProps = ComponentProps<typeof parts.Meter>;

/** UI SDK's Meter: a bar and the amounts, unless you pass children, a function that gets the Meter's props. */
export function QuotaNoticeMeter(props: QuotaNoticeMeterProps) {
  return (
    <parts.Meter {...omit(props, "children")}>
      {props.children ??
        ((meter: QuotaNoticeMeterState) => (
          <Meter
            value={meter.value}
            max={meter.max}
            locale={meter.locale}
            format={meter.format}
            getValueLabel={meter.getValueLabel}
            aria-label={meter.label}
            data-agent-hidden=""
          >
            <MeterTrack>
              <MeterIndicator />
            </MeterTrack>
            <MeterValue />
          </Meter>
        ))}
    </parts.Meter>
  );
}

export type QuotaNoticeResetProps = ComponentProps<typeof parts.Reset>;

/** "Resets in 3 days", unless you pass children. Rendered only with a `resetAt`. */
export function QuotaNoticeReset(props: QuotaNoticeResetProps) {
  return <parts.Reset {...props}>{props.children ?? ((state) => state.text)}</parts.Reset>;
}

export type QuotaNoticeUpgradeProps = ComponentProps<typeof parts.Upgrade>;

/** Calls `onUpgrade`. Reads the `upgradeLabel` unless you pass children. Rendered only with `onUpgrade`. */
export function QuotaNoticeUpgrade(props: QuotaNoticeUpgradeProps) {
  return <parts.Upgrade {...props}>{props.children ?? ((state) => state.label)}</parts.Upgrade>;
}
