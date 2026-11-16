import {
  type ChangeDetails,
  createPopup,
  css,
  definePrimitive,
  type PopupContentProps,
  type PopupContentState,
  type PopupPreset,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  popupContent,
  popupDescription,
  popupState,
  popupTitle,
  popupTrigger,
  type SlotDefinition,
} from "@ui-sdk/core";
import { hoverCardPreset } from "@ui-sdk/core/hover-card";
import { type PopoverOpenChangeReason, popoverPreset } from "@ui-sdk/core/popover";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { TokenUsage } from "../../types/index.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { type ContextRow, contextRatio, contextRows, contextValueText } from "./format.js";

/** `"normal"` below 80%, `"high"` from 80% and `"full"` from 95%. */
export type ContextLevel = "normal" | "high" | "full";

/** Why the details opened or closed: UI SDK Popover's reasons, and `"trigger-focus"` for keyboard focus. */
export type ContextMeterOpenChangeReason = PopoverOpenChangeReason | "trigger-focus";

export type ContextMeterOptions = {
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
   * The ISO 4217 code `cost` is in.
   * @default "USD"
   */
  currency?: string;
  /** The locale numbers are formatted in, like `"de-DE"`. Defaults to the browser's. */
  locale?: string;
  /**
   * Names the meter.
   * @default "Context"
   */
  label?: string;
  /** Whether the details are open. Passing it controls them: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the details are open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the details open or close, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<ContextMeterOpenChangeReason>) => void;
  /**
   * How the ring fills and the details open: at full motion the ring sweeps and the details rise in; reduced motion
   * only fades. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ContextMeterState = PopupState & {
  /** The `label`, else "Context". */
  label: string;
  /** The `used` option. */
  used: number;
  /** The `total` option. */
  total: number;
  /** How much of the window is used, from 0 to 1. */
  ratio: number;
  /** How full the window is. */
  level: ContextLevel;
  /** The value screen readers hear, like "57,600 of 128,000 tokens, 45%". */
  valueText: string;
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
  /** The `locale` option. */
  locale: string | undefined;
  /** The `motion` option. */
  motion: MotionMode;
};

/** The props the value part hands UI SDK's Meter. */
export type ContextMeterValueState = {
  /** Pass it to the Meter as its `value`. */
  value: number;
  /** Pass it to the Meter as its `max`. */
  max: number;
  /** Pass it to the Meter. */
  locale: string | undefined;
  /** Pass it to the Meter as its `aria-label`. */
  label: string;
  /** Pass it to the Meter, so screen readers hear the tokens as well as the percentage. */
  getValueLabel: () => string;
};

type Popup = ReturnType<typeof createPopup<ContextMeterOptions, ContextMeterState, PopupPreset>>;

export type ContextMeterApi = Omit<Popup, "open" | "close"> & {
  /** Opens the details. Offered only while they're closed. Returns whether the change was accepted. */
  readonly open: (() => boolean) | undefined;
  /** Closes the details. Offered only while they're open. Returns whether the change was accepted. */
  readonly close: (() => boolean) | undefined;
  /** Hands the Meter its props. Called by the value slot. */
  valueState: (state: ContextMeterState) => ContextMeterValueState;
  /** The details' lines. Called by the rows slot. */
  rows: (state: ContextMeterState) => ContextRow[];
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<ContextMeterState, ContextMeterApi, Props, Public>;

type ContextMeterSlots = {
  root: Slot;
  trigger: Slot<PopupTriggerProps & BaseSlotProps, PopupTriggerState>;
  value: Slot<BaseSlotProps, ContextMeterValueState>;
  content: Slot<PopupContentProps & BaseSlotProps, PopupContentState>;
  title: Slot<BaseSlotProps, { label: string }>;
  description: Slot<BaseSlotProps, { valueText: string }>;
  rows: Slot<BaseSlotProps, { rows: ContextRow[] }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ContextMeterPrimitive = ReturnType<
  typeof definePrimitive<ContextMeterOptions, ContextMeterState, ContextMeterApi, ContextMeterSlots>
>;

// Spec D3: a Popover that also opens when the pointer or keyboard focus rests on its trigger, after a hover card's
// delays.
const preset: PopupPreset = {
  ...popoverPreset,
  focus: hoverCardPreset.focus,
  delay: hoverCardPreset.delay,
  closeDelay: hoverCardPreset.closeDelay,
};

// `createPopup` opens on hover only when the options say so. A prototype rather than a spread, because on Web
// Components `@ui-sdk/web` fills in the callbacks on read.
const HOVER = { openOnHover: { value: true } };

const presentation = (options: ContextMeterOptions): Omit<ContextMeterState, keyof PopupState> => {
  const used = options.used ?? 0;
  const total = options.total ?? 0;
  const ratio = contextRatio(used, total);
  return {
    label: options.label ?? "Context",
    used,
    total,
    ratio,
    level: ratio >= 0.95 ? "full" : ratio >= 0.8 ? "high" : "normal",
    valueText: contextValueText(used, total, options.locale),
    input: options.usage?.input,
    output: options.usage?.output,
    reasoning: options.usage?.reasoning,
    cached: options.usage?.cached,
    cost: options.cost,
    currency: options.currency ?? "USD",
    locale: options.locale,
    motion: options.motion ?? "auto",
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
    used: "number",
    total: "number",
    usage: "value",
    cost: "number",
    currency: "string",
    locale: "string",
    label: "string",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    motion: "string",
  },
  state: (options) => ({ ...popupState(options), ...presentation(options) }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open"],
  api: (context) => {
    const popup = createPopup(
      { ...context, options: (): ContextMeterOptions => Object.create(context.options(), HOVER) },
      { preset },
    );
    const { store } = context;
    const valueState = memo(
      (value: number, max: number, locale: string | undefined, label: string, valueText: string) => ({
        value,
        max,
        locale,
        label,
        getValueLabel: () => valueText,
      }),
    );
    const rows = memo(
      (
        input: number | undefined,
        output: number | undefined,
        reasoning: number | undefined,
        cached: number | undefined,
        cost: number | undefined,
        currency: string,
        locale: string | undefined,
      ) => contextRows({ input, output, reasoning, cached }, cost, currency, locale),
    );
    return {
      ...popup,
      get open() {
        return store.get().open ? undefined : () => popup.setOpen(true);
      },
      get close() {
        return store.get().open ? () => popup.setOpen(false) : undefined;
      },
      valueState: (state) => valueState(state.used, state.total, state.locale, state.label, state.valueText),
      rows: (state) =>
        rows(
          state.input,
          state.output,
          state.reasoning,
          state.cached,
          state.cost,
          state.currency,
          state.locale,
        ),
    };
  },
  slots: (slot) => {
    const trigger = popupTrigger(slot);
    return {
      root: slot({
        role: "group",
        attrs: (state) => ({
          "aria-label": state.label,
          "data-level": state.level,
          "data-motion": state.motion,
          style: css({ "--kind-context-ratio": String(state.ratio) }),
        }),
      }),
      // Named by its value, since the meter inside a button isn't read on its own.
      trigger: slot({
        ...trigger,
        attrs: (state, part) => ({
          ...trigger.attrs?.(state, part),
          type: "button",
          "aria-label": state.valueText,
        }),
      }),
      value: slot<BaseSlotProps, ContextMeterValueState>({
        state: (state, { api }) => api.valueState(state),
      }),
      content: popupContent(slot),
      title: slot({ ...popupTitle(slot), state: (state) => ({ label: state.label }) }),
      description: slot({ ...popupDescription(slot), state: (state) => ({ valueText: state.valueText }) }),
      rows: slot<BaseSlotProps, { rows: ContextRow[] }>({
        present: (state, { api }) => api.rows(state).length > 0,
        state: (state, { api }) => ({ rows: api.rows(state) }),
      }),
    };
  },
  agent: { actions: ["open", "close"] },
});
