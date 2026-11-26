import { definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { TokenUsage } from "../../types/index.js";
import { memo } from "../memo.js";
import {
  type MeterBaseApi,
  type MeterBaseOptions,
  type MeterBaseState,
  type MeterOpenChangeReason,
  type MeterValueState,
  meterBase,
} from "../meter-base.js";
import { type ContextRow, contextCountText, contextRatio, contextRows, contextValueText } from "./format.js";

/** `"normal"` below 80%, `"high"` from 80% and `"full"` from 95%. */
export type ContextLevel = "normal" | "high" | "full";

/** Why the details opened or closed: UI SDK Popover's reasons, and `"trigger-focus"` for keyboard focus. */
export type ContextMeterOpenChangeReason = MeterOpenChangeReason;

export type ContextMeterOptions = MeterBaseOptions & {
  /**
   * Tokens the conversation takes up in the context window.
   * @default 0
   */
  used?: number;
  /**
   * Tokens the context window holds.
   * @default 0
   */
  total?: number;
  /** Token counts the details list: input, output, reasoning and cached. Only the counts you supply show. */
  usage?: TokenUsage;
  /** What the conversation has cost so far, in `currency`. The details show it when supplied. */
  cost?: number;
  /**
   * The ISO 4217 code `cost` is in, like `"EUR"`.
   * @default "USD"
   */
  currency?: string;
  /**
   * Names the meter.
   * @default "Context"
   */
  label?: string;
  /** What fills the window, in tokens, like system, tools, messages and files. */
  breakdown?: MeterBaseOptions["breakdown"];
};

export type ContextMeterState = MeterBaseState & {
  /** The `used` option. */
  used: number;
  /** The `total` option. */
  total: number;
  /** How full the window is, by the percentage shown. */
  level: ContextLevel;
  /** `usage.input`. */
  input: number | undefined;
  /** `usage.output`. */
  output: number | undefined;
  /** `usage.reasoning`. */
  reasoning: number | undefined;
  /** `usage.cached`. */
  cached: number | undefined;
  /** The `cost` option. */
  cost: number | undefined;
  /** The `currency`, else "USD". */
  currency: string;
};

/** The props the value part hands UI SDK's Meter. */
export type ContextMeterValueState = MeterValueState;

export type ContextMeterApi = MeterBaseApi<ContextMeterState> & {
  /** The details' lines. Called by the rows slot. */
  rows: (state: ContextMeterState) => ContextRow[];
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<ContextMeterState, ContextMeterApi, Props, Public>;

type Base = ReturnType<
  ReturnType<typeof meterBase<ContextMeterOptions, ContextMeterState, ContextMeterApi>>["slots"]
>;

type ContextMeterSlots = { [Key in keyof Base]: Base[Key] } & {
  rows: Slot<BaseSlotProps, { rows: ContextRow[] }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ContextMeterPrimitive = ReturnType<
  typeof definePrimitive<ContextMeterOptions, ContextMeterState, ContextMeterApi, ContextMeterSlots>
>;

const count = (value: number | undefined) => (value !== undefined && Number.isFinite(value) ? value : 0);

const base = meterBase<ContextMeterOptions, ContextMeterState, ContextMeterApi>({
  label: "Context",
  amount: (state) => ({ value: state.used, max: state.total }),
  valueText: (state, locale) => contextValueText(state.used, state.total, locale),
  countText: (state, locale) => contextCountText(state.used, state.total, locale),
  sliceText: (value, _state, locale) => new Intl.NumberFormat(locale).format(value),
  keys: ["used", "total"],
});

const presentation = (options: ContextMeterOptions) => {
  const used = count(options.used);
  const total = count(options.total);
  const percent = Math.round(contextRatio(used, total) * 100);
  return {
    used,
    total,
    level: (percent >= 95 ? "full" : percent >= 80 ? "high" : "normal") as ContextLevel,
    input: options.usage?.input,
    output: options.usage?.output,
    reasoning: options.usage?.reasoning,
    cached: options.usage?.cached,
    cost: options.cost,
    currency: options.currency ?? "USD",
  };
};

export const contextMeterPrimitive: ContextMeterPrimitive = definePrimitive<
  ContextMeterOptions,
  ContextMeterState,
  ContextMeterApi,
  ContextMeterSlots
>({
  name: "kind-context-meter",
  options: {
    ...base.options,
    used: "number",
    total: "number",
    usage: "value",
    cost: "number",
    currency: "string",
  },
  state: (options) => ({ ...base.state(options), ...presentation(options) }),
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  controlled: base.controlled,
  api: (context) => {
    const rows = memo(
      (
        input: number | undefined,
        output: number | undefined,
        reasoning: number | undefined,
        cached: number | undefined,
        cost: number | undefined,
        currency: string,
        locale: string,
      ) => contextRows({ input, output, reasoning, cached }, cost, currency, locale),
    );
    // Added to the base's api rather than spread, which would read its `open` and `close` getters once.
    return Object.assign(base.api(context), {
      rows: (state: ContextMeterState) =>
        rows(
          state.input,
          state.output,
          state.reasoning,
          state.cached,
          state.cost,
          state.currency,
          base.localeOf(state),
        ),
    });
  },
  slots: (slot) => ({
    ...base.slots(slot),
    rows: slot<BaseSlotProps, { rows: ContextRow[] }>({
      present: (state, { api }) => api.rows(state).length > 0,
      state: (state, { api }) => ({ rows: api.rows(state) }),
    }),
  }),
  agent: base.agent,
});
