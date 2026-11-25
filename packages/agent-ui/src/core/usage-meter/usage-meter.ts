import { definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { type Countdown, countdownText, createCountdown } from "../countdown.js";
import {
  type MeterBaseApi,
  type MeterBaseOptions,
  type MeterBaseState,
  type MeterOpenChangeReason,
  meterBase,
} from "../meter-base.js";
import { type UsageUnit, usageAmount, usageCountText, usageValueText } from "./format.js";

/** `"normal"` below `warnAt`, `"warning"` from it and `"error"` at the limit. */
export type UsageLevel = "normal" | "warning" | "error";

/** Why the details opened or closed: UI SDK Popover's reasons, and `"trigger-focus"` for keyboard focus. */
export type UsageMeterOpenChangeReason = MeterOpenChangeReason;

export type UsageMeterOptions = MeterBaseOptions & {
  /**
   * How much has been used, in `unit`.
   * @default 0
   */
  used?: number;
  /**
   * The most there can be, in `unit`.
   * @default 0
   */
  limit?: number;
  /**
   * What the meter counts.
   * @default "currency"
   */
  unit?: UsageUnit;
  /**
   * The ISO 4217 code of the amounts when `unit` is `"currency"`, like `"EUR"`.
   * @default "USD"
   */
  currency?: string;
  /** The span the limit covers, like "This month". The details show it. */
  period?: string;
  /** When the usage starts over (ISO 8601). The details count down to it. */
  resetAt?: string;
  /**
   * The share of the limit, from 0 to 1, from which the meter warns.
   * @default 0.8
   */
  warnAt?: number;
  /**
   * Names the meter.
   * @default "Usage"
   */
  label?: string;
  /** What makes up the usage, in `unit`, like each model or agent. */
  breakdown?: MeterBaseOptions["breakdown"];
};

export type UsageMeterState = MeterBaseState & {
  /** The `used` option. */
  used: number;
  /** The `limit` option. */
  limit: number;
  /** The `unit`, else `"currency"`. */
  unit: UsageUnit;
  /** The `currency`, else "USD". */
  currency: string;
  /** The `period` option. */
  period: string | undefined;
  /** The `resetAt` option. */
  resetAt: string | undefined;
  /** How full the meter is, against `warnAt` and the limit. */
  level: UsageLevel;
  /** Whole seconds until `resetAt`, counted once the meter is in the page. Null on the server. Live. */
  resetSeconds: number | null;
};

export type UsageMeterApi = MeterBaseApi<UsageMeterState> & {
  /** Counts down to `resetAt`. The root binds it. */
  countdown: Countdown;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<UsageMeterState, UsageMeterApi, Props, Public>;

type Base = ReturnType<
  ReturnType<typeof meterBase<UsageMeterOptions, UsageMeterState, UsageMeterApi>>["slots"]
>;

type UsageMeterSlots = { [Key in keyof Base]: Base[Key] } & {
  period: Slot<BaseSlotProps, { text: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type UsageMeterPrimitive = ReturnType<
  typeof definePrimitive<UsageMeterOptions, UsageMeterState, UsageMeterApi, UsageMeterSlots>
>;

const count = (value: number | undefined) => (value !== undefined && Number.isFinite(value) ? value : 0);

const base = meterBase<UsageMeterOptions, UsageMeterState, UsageMeterApi>({
  label: "Usage",
  amount: (state) => ({ value: state.used, max: state.limit }),
  valueText: (state, locale) =>
    usageValueText(state.label, state.used, state.limit, state.unit, state.currency, locale),
  countText: (state, locale) => usageCountText(state.used, state.limit, state.unit, state.currency, locale),
  sliceText: (value, state, locale) => usageAmount(value, state.unit, state.currency, locale, true),
  keys: ["used", "limit", "unit", "currency", "label"],
});

const UNITS: readonly UsageUnit[] = ["tokens", "requests", "currency"];

const presentation = (options: UsageMeterOptions) => {
  const used = count(options.used);
  const limit = count(options.limit);
  const warnAt = options.warnAt !== undefined && Number.isFinite(options.warnAt) ? options.warnAt : 0.8;
  const ratio = limit > 0 ? used / limit : 0;
  return {
    used,
    limit,
    unit: UNITS.includes(options.unit as UsageUnit) ? (options.unit as UsageUnit) : "currency",
    currency: options.currency ?? "USD",
    period: options.period,
    resetAt: options.resetAt,
    level: (ratio >= 1 ? "error" : ratio >= warnAt ? "warning" : "normal") as UsageLevel,
  };
};

/** The period and the reset, like "This month · Resets in 3 hr". */
const periodText = (state: UsageMeterState, locale: string) => {
  const reset = countdownText(state.resetSeconds, locale);
  return [state.period, reset && `Resets ${reset}`].filter(Boolean).join(" · ");
};

/**
 * Usage against a limit (Wave 7 spec §5): spend, requests or tokens for a period, a ring that warns from `warnAt`,
 * and details with the amounts, the period, a countdown to the reset and a breakdown.
 */
export const usageMeterPrimitive: UsageMeterPrimitive = definePrimitive<
  UsageMeterOptions,
  UsageMeterState,
  UsageMeterApi,
  UsageMeterSlots
>({
  name: "kind-usage-meter",
  options: {
    ...base.options,
    used: "number",
    limit: "number",
    unit: "string",
    currency: "string",
    period: "string",
    resetAt: "string",
    warnAt: "number",
  },
  state: (options) => ({ ...base.state(options), ...presentation(options), resetSeconds: null }),
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  live: ["resetSeconds"],
  controlled: base.controlled,
  api: (context) =>
    // Added to the base's api rather than spread, which would read its `open` and `close` getters once.
    Object.assign(base.api(context), {
      countdown: createCountdown(context, { key: "resetSeconds", at: () => context.store.get().resetAt }),
    }),
  slots: (slot) => {
    const slots = base.slots(slot);
    return {
      ...slots,
      root: slot({
        ...slots.root,
        bind: (el, part) => {
          slots.root.bind?.(el, part);
          return part.api.countdown.bind();
        },
      }),
      // Reads the live `resetSeconds`, so a tick renders this part alone.
      period: slot<BaseSlotProps, { text: string }>({
        present: (state) => !!(state.period || state.resetAt),
        state: (state) => ({ text: periodText(state, base.localeOf(state)) }),
        attrs: () => ({ "data-meter-part": "period" }),
      }),
    };
  },
  agent: base.agent,
});
