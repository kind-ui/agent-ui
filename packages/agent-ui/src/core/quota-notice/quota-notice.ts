import {
  type ActionDetails,
  definePrimitive,
  type PrimitiveContext,
  pageLocale,
  type SlotDefinition,
  sourceOf,
  toLocale,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { actionSource } from "../action-source.js";
import { countdownText, createCountdown } from "../countdown.js";
import { memo } from "../memo.js";
import {
  type NoticeApi,
  type NoticeOptions,
  type NoticeState,
  type NoticeVariant,
  noticeBase,
} from "../notice/base.js";
import { dayLabel } from "../time.js";

export type QuotaNoticeUpgradeDetails = ActionDetails & { reason: "upgrade-press" | "imperative" };

export type QuotaNoticeOptions = Omit<NoticeOptions, "label" | "variant"> & {
  /** How much of the quota is used, in `unit`s. */
  used: number;
  /** The quota, in `unit`s. */
  limit: number;
  /**
   * What the quota counts, as a plural noun.
   * @default "requests"
   */
  unit?: string;
  /** The period the quota covers, like "this month", which the default title reads as "this month's requests". */
  period?: string;
  /** The ISO 8601 instant the quota resets at. Shows "Resets in 3 days" while set. */
  resetAt?: string;
  /**
   * The share of `limit`, from 0 to 1, from which the notice warns.
   * @default 0.8
   */
  warnAt?: number;
  /** How the notice reads. Defaults to `"error"` at the limit, `"warning"` from `warnAt` and `"info"` below it. */
  variant?: NoticeVariant;
  /**
   * The notice's title, which names it. Defaults to "You've used 80% of this month's requests", or "You've used all
   * of this month's requests" at the limit. Announced when the variant changes, never when only `used` does.
   */
  label?: string;
  /**
   * The Upgrade button's words.
   * @default "Upgrade"
   */
  upgradeLabel?: string;
  /** Called when Upgrade is pressed, with who pressed it. Shows Upgrade while set. */
  onUpgrade?: (details: QuotaNoticeUpgradeDetails) => void;
  /**
   * The ISO 8601 instant the reset countdown counts from, in place of the clock, for a page that shows a fixed
   * moment. Without it the countdown follows the clock once the notice is in the page; server markup shows the date.
   */
  now?: string;
  /**
   * The locale numbers and dates are formatted in, like `"de-DE"`. Defaults to the page's `lang`, or the browser's
   * language without one, once the notice is in the page; server markup uses English until then.
   */
  locale?: string;
};

export type QuotaNoticeState = NoticeState & {
  /** The `used` option, or 0. */
  used: number;
  /** The `limit` option, or 0. */
  limit: number;
  /** The `unit`, else "requests". */
  unit: string;
  /** The `resetAt` option. */
  resetAt: string | undefined;
  /** The `now` option. */
  now: string | undefined;
  /** The `upgradeLabel`, else "Upgrade". */
  upgradeLabel: string;
  /** Whether `onUpgrade` is set. */
  canUpgrade: boolean;
  /** The `locale` option, when it's a valid tag. */
  locale: string | undefined;
  /** The page's language where the notice is, read once it's in the page. Null on the server. */
  pageLocale: string | null;
  /** Whole seconds until `resetAt` once the notice is in the page and no `now` is passed, else null. Live. */
  seconds: number | null;
};

/** The props the meter part hands UI SDK's Meter. */
export type QuotaNoticeMeterState = {
  /** Pass it to the Meter as its `value`. */
  value: number;
  /** Pass it to the Meter as its `max`. */
  max: number;
  /** Pass it to the Meter. */
  locale: string;
  /** Pass it to the Meter as its `aria-label`. */
  label: string;
  /** Pass it to the Meter: the visible value, like "800 of 1,000 requests". */
  format: () => string;
  /** Pass it to the Meter, so screen readers hear the amounts and the percentage. */
  getValueLabel: () => string;
};

export type QuotaNoticeApi = NoticeApi & {
  /** Calls `onUpgrade`, as Upgrade does. Offered while `onUpgrade` is set. */
  readonly upgrade: ((event?: Event) => void) | undefined;
  /** Hands the Meter its props. Called by the meter slot. */
  meterState: (state: QuotaNoticeState) => QuotaNoticeMeterState;
  /** "Resets in 3 days", or the date before the notice is in the page. Called by the reset slot. */
  resetText: (state: QuotaNoticeState) => string;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  QuotaNoticeState,
  QuotaNoticeApi,
  BaseSlotProps,
  Public
>;

type QuotaNoticeSlots = {
  root: Slot;
  icon: Slot;
  title: Slot<{ label: string }>;
  meter: Slot<QuotaNoticeMeterState>;
  reset: Slot<{ text: string }>;
  description: Slot;
  actions: Slot;
  upgrade: Slot<{ label: string }>;
  dismiss: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type QuotaNoticePrimitive = ReturnType<
  typeof definePrimitive<QuotaNoticeOptions, QuotaNoticeState, QuotaNoticeApi, QuotaNoticeSlots>
>;

const DEFAULT_UNIT = "requests";
const DEFAULT_WARN_AT = 0.8;
const VARIANTS: readonly NoticeVariant[] = ["info", "success", "warning", "error"];

// Web attributes are untyped: anything but a finite number reads as 0.
const finite = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const share = (options: QuotaNoticeOptions) => {
  const limit = finite(options.limit);
  return limit > 0 ? finite(options.used) / limit : 0;
};

/** The variant the host passed, else the quota's: `error` at the limit, `warning` from `warnAt`, else `info`. */
const variantOf = (options: QuotaNoticeOptions): NoticeVariant => {
  if (options.variant && VARIANTS.includes(options.variant)) return options.variant;
  const used = share(options);
  if (used >= 1) return "error";
  return used >= (options.warnAt ?? DEFAULT_WARN_AT) ? "warning" : "info";
};

const titleOf = (options: QuotaNoticeOptions) => {
  const unit = options.unit ?? DEFAULT_UNIT;
  const what = options.period ? `${options.period}'s ${unit}` : `your ${unit}`;
  const used = share(options);
  return used >= 1 ? `You've used all of ${what}` : `You've used ${Math.floor(used * 100)}% of ${what}`;
};

// The base reads the variant from the options, so it's handed the quota's. A prototype keeps the callbacks
// `@ui-sdk/web` fills in on read, which a spread would read once.
const derived = (options: QuotaNoticeOptions): QuotaNoticeOptions =>
  Object.create(options, { variant: { value: variantOf(options), enumerable: true } });

const base = noticeBase<QuotaNoticeState, QuotaNoticeApi, QuotaNoticeOptions>({ label: titleOf });

const presentation = (options: QuotaNoticeOptions) => ({
  used: finite(options.used),
  limit: finite(options.limit),
  unit: options.unit ?? DEFAULT_UNIT,
  resetAt: options.resetAt,
  now: options.now,
  upgradeLabel: options.upgradeLabel ?? "Upgrade",
  canUpgrade: options.onUpgrade !== undefined,
  locale: toLocale(options.locale),
});

// Server markup is English, as UI SDK Meter's is, so it never disagrees with the client's.
const localeOf = (state: QuotaNoticeState) => state.locale ?? state.pageLocale ?? "en-US";

const secondsLeft = (state: QuotaNoticeState) => {
  if (state.now === undefined || state.resetAt === undefined) return state.seconds;
  const left = Date.parse(state.resetAt) - Date.parse(state.now);
  return Number.isNaN(left) ? null : Math.max(0, Math.ceil(left / 1000));
};

/**
 * A Notice about a quota (Wave 7 spec §5): its title says how much is used, a bar (UI SDK's Meter) shows it with
 * the amounts in words, "Resets in 3 days" counts down to `resetAt`, and Upgrade and Dismiss act on it. It warns
 * from `warnAt`, turns to an error at the limit, and announces only those changes, never the countdown.
 */
export const quotaNoticePrimitive: QuotaNoticePrimitive = definePrimitive<
  QuotaNoticeOptions,
  QuotaNoticeState,
  QuotaNoticeApi,
  QuotaNoticeSlots
>({
  name: "kind-quota-notice",
  ...base,
  options: {
    ...base.options,
    used: "number",
    limit: "number",
    unit: "string",
    period: "string",
    resetAt: "string",
    warnAt: "number",
    upgradeLabel: "string",
    onUpgrade: "callback",
    now: "string",
    locale: "string",
  },
  state: (options) => ({
    ...base.state(derived(options)),
    ...presentation(options),
    pageLocale: null,
    seconds: null,
  }),
  sync: (options) => ({ ...base.sync(derived(options)), ...presentation(options) }),
  live: ["seconds"],
  api: (context) => {
    const { store } = context;
    const notice = base.api({
      ...context,
      options: () => derived(context.options()),
      onOptions: (listener) => context.onOptions((options, synced) => listener(derived(options), synced)),
    } as PrimitiveContext<QuotaNoticeOptions, NoticeState, string>);
    const countdown = createCountdown(context, {
      key: "seconds",
      at: () => (store.get().now === undefined ? store.get().resetAt : undefined),
    });
    const upgrade = (event?: Event) => {
      const reason = event ? "upgrade-press" : "imperative";
      context.options().onUpgrade?.({ reason, source: actionSource(event, reason) });
    };
    const meterState = memo(
      (value: number, max: number, locale: string, unit: string): QuotaNoticeMeterState => {
        const numbers = new Intl.NumberFormat(locale);
        const amounts = `${numbers.format(value)} of ${numbers.format(max)} ${unit}`;
        const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(
          max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0,
        );
        return {
          value,
          max,
          locale,
          label: "Usage",
          format: () => amounts,
          getValueLabel: () => `${amounts}, ${percent}`,
        };
      },
    );
    return {
      ...notice,
      // A spread reads the getter once, and `dismiss` is offered only while it can run.
      get dismiss() {
        return notice.dismiss;
      },
      bindRoot: (el, part) => {
        // Starts UI SDK's input tracking, so the first keyboard press on Upgrade reads as one, as Dictation does.
        sourceOf();
        store.set({ pageLocale: pageLocale(el) ?? null });
        const unbindNotice = notice.bindRoot(el, part);
        const unbindCountdown = countdown.bind();
        return () => {
          unbindCountdown();
          unbindNotice();
        };
      },
      get upgrade() {
        return store.get().canUpgrade ? upgrade : undefined;
      },
      meterState: (state) => meterState(state.used, state.limit, localeOf(state), state.unit),
      resetText: (state) => {
        if (state.resetAt === undefined) return "";
        const seconds = secondsLeft(state);
        if (seconds === null) {
          const day = dayLabel(state.resetAt, { locale: localeOf(state) });
          return day ? `Resets on ${day}` : "";
        }
        return seconds > 0 ? `Resets ${countdownText(seconds, localeOf(state))}` : "Resets now";
      },
    };
  },
  slots: (slot) => {
    const { root, icon, title, description, actions, dismiss } = base.slots(slot);
    return {
      root,
      icon,
      title,
      meter: slot<BaseSlotProps, QuotaNoticeMeterState>({
        state: (state, { api }) => api.meterState(state),
        attrs: () => ({ "data-notice-part": "meter" }),
      }),
      // Not a live region: the countdown is never announced.
      reset: slot<BaseSlotProps, { text: string }>({
        present: (state) => state.resetAt !== undefined,
        state: (state, { api }) => ({ text: api.resetText(state) }),
        attrs: () => ({ "data-notice-part": "reset" }),
      }),
      description,
      actions: slot({
        ...actions,
        attrs: (state, part) => ({
          ...actions.attrs?.(state, part),
          "data-can-upgrade": state.canUpgrade ? "" : undefined,
        }),
      }),
      upgrade: slot<BaseSlotProps, { label: string }>({
        role: "button",
        focus: "native",
        present: (state) => state.canUpgrade,
        press: ({ api }, event) => api.upgrade?.(event),
        state: (state) => ({ label: state.upgradeLabel }),
        attrs: () => ({
          type: "button",
          "data-notice-part": "upgrade",
          "data-kind-button": "secondary",
          "data-kind-size": "sm",
        }),
      }),
      dismiss,
    };
  },
  agent: { actions: ["dismiss", "upgrade"] },
});
